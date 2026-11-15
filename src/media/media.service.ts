import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async presignChunk(
    interviewId: string,
    streamType: 'camera' | 'screen',
    chunkIndex: number,
    contentType: string,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    const key = `companies/${interview.companyId}/interviews/${interviewId}/${streamType}/${chunkIndex}.webm`;
    const presigned = await this.storage.presignedPut(key, contentType);
    return { ...presigned, chunkIndex, streamType };
  }

  async confirmChunk(
    interviewId: string,
    streamType: string,
    chunkIndex: number,
    storageKey: string,
    byteSize: number,
  ) {
    return this.prisma.mediaChunk.upsert({
      where: {
        interviewId_streamType_chunkIndex: {
          interviewId,
          streamType,
          chunkIndex,
        },
      },
      create: {
        interviewId,
        streamType,
        chunkIndex,
        storageKey,
        byteSize,
      },
      update: { storageKey, byteSize, uploadedAt: new Date() },
    });
  }

  async presignSnapshot(interviewId: string, contentType: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    const key = `companies/${interview.companyId}/interviews/${interviewId}/snapshots/${Date.now()}.jpg`;
    return this.storage.presignedPut(key, contentType);
  }

  async saveSnapshot(interviewId: string, storageKey: string, eventType?: string) {
    return this.prisma.snapshot.create({
      data: { interviewId, storageKey, eventType },
    });
  }

  async playbackUrl(companyId: string, interviewId: string, storageKey: string) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, companyId },
    });
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }
    const url = await this.storage.presignedGet(storageKey);
    return { url, expiresIn: 900 };
  }
}
