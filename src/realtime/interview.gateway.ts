import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProctoringService } from '../proctoring/proctoring.service';
import { SessionsService } from '../sessions/sessions.service';

const HEARTBEAT_TIMEOUT_MS = 30_000;

@WebSocketGateway({
  namespace: '/interview',
  cors: { origin: true },
})
export class InterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(InterviewGateway.name);
  private heartbeats = new Map<string, NodeJS.Timeout>();
  private interviewBySocket = new Map<string, string>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly proctoring: ProctoringService,
    private readonly sessions: SessionsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        (client.handshake.query?.token as string);
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if (payload.aud !== 'candidate') {
        client.disconnect();
        return;
      }
      const interviewId = client.handshake.query?.interviewId as string;
      client.data.user = payload;
      client.data.interviewId = interviewId;
      this.interviewBySocket.set(client.id, interviewId);
      this.resetHeartbeat(client);
      client.join(`interview:${interviewId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const t = this.heartbeats.get(client.id);
    if (t) {
      clearTimeout(t);
    }
    this.heartbeats.delete(client.id);
    this.interviewBySocket.delete(client.id);
  }

  @SubscribeMessage('heartbeat')
  onHeartbeat(@ConnectedSocket() client: Socket) {
    this.resetHeartbeat(client);
    return { ok: true };
  }

  @SubscribeMessage('proctoring_batch')
  async onProctoring(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      events: Array<{
        eventType: string;
        severity?: string;
        payload?: Record<string, unknown>;
        clientTimestamp?: string;
      }>;
    },
  ) {
    const interviewId = client.data.interviewId as string;
    const result = await this.proctoring.ingestBatch(interviewId, body.events ?? []);
    if (result.terminated) {
      this.server.to(`interview:${interviewId}`).emit('terminated', {
        reason: 'strike_limit',
      });
    }
    this.server.to(`recruiter:${interviewId}`).emit('proctoring_flag', result);
    return result;
  }

  @SubscribeMessage('request_next')
  async onNext(@ConnectedSocket() client: Socket) {
    const interviewId = client.data.interviewId as string;
    const candidateId = client.data.user.sub as string;
    const next = await this.sessions.nextQuestion(interviewId, candidateId);
    client.emit('next_question', next);
    return next;
  }

  private resetHeartbeat(client: Socket) {
    const existing = this.heartbeats.get(client.id);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      void this.onMissedHeartbeat(client);
    }, HEARTBEAT_TIMEOUT_MS);
    this.heartbeats.set(client.id, timer);
  }

  private async onMissedHeartbeat(client: Socket) {
    const interviewId = client.data.interviewId as string;
    if (!interviewId) {
      return;
    }
    await this.proctoring.recordDisconnect(interviewId);
    this.server.to(`interview:${interviewId}`).emit('warning', {
      code: 'DISCONNECTED',
      message: 'Heartbeat missed',
    });
    this.logger.warn(`Heartbeat timeout interview=${interviewId}`);
  }
}
