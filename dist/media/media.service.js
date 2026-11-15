"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
let MediaService = class MediaService {
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async presignChunk(interviewId, streamType, chunkIndex, contentType) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const key = `companies/${interview.companyId}/interviews/${interviewId}/${streamType}/${chunkIndex}.webm`;
        const presigned = await this.storage.presignedPut(key, contentType);
        return { ...presigned, chunkIndex, streamType };
    }
    async confirmChunk(interviewId, streamType, chunkIndex, storageKey, byteSize) {
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
    async presignSnapshot(interviewId, contentType) {
        const interview = await this.prisma.interview.findUnique({
            where: { id: interviewId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const key = `companies/${interview.companyId}/interviews/${interviewId}/snapshots/${Date.now()}.jpg`;
        return this.storage.presignedPut(key, contentType);
    }
    async saveSnapshot(interviewId, storageKey, eventType) {
        return this.prisma.snapshot.create({
            data: { interviewId, storageKey, eventType },
        });
    }
    async playbackUrl(companyId, interviewId, storageKey) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const url = await this.storage.presignedGet(storageKey);
        return { url, expiresIn: 900 };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], MediaService);
//# sourceMappingURL=media.service.js.map