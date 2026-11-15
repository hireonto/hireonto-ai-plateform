import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/recruiter',
  cors: { origin: true },
})
export class RecruiterGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RecruiterGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.query?.token as string);
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if (payload.aud !== 'staff') {
        client.disconnect();
        return;
      }
      client.data.user = payload;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('watch_interview')
  async watch(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { interviewId: string },
  ) {
    const companyId = client.data.user.companyId as string;
    const interview = await this.prisma.interview.findFirst({
      where: { id: body.interviewId, companyId },
    });
    if (!interview) {
      return { error: 'not_found' };
    }
    client.join(`recruiter:${body.interviewId}`);
    return { watching: body.interviewId };
  }

  @SubscribeMessage('dashboard_subscribe')
  async dashboard(@ConnectedSocket() client: Socket) {
    const companyId = client.data.user.companyId as string;
    client.join(`company:${companyId}`);
    const counts = await this.prisma.interview.groupBy({
      by: ['status'],
      where: { companyId, deletedAt: null },
      _count: true,
    });
    return { counts };
  }

  emitLiveTranscript(interviewId: string, segment: { text: string; answerId: string }) {
    this.server.to(`recruiter:${interviewId}`).emit('live_transcript', segment);
  }

  emitCompanyCounter(companyId: string, payload: Record<string, unknown>) {
    this.server.to(`company:${companyId}`).emit('live_counters', payload);
  }
}
