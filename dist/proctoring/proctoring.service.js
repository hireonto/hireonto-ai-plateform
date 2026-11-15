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
exports.ProctoringService = exports.STRIKE_TERMINATE_THRESHOLD = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
exports.STRIKE_TERMINATE_THRESHOLD = 3;
let ProctoringService = class ProctoringService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ingestBatch(interviewId, events) {
        if (!events.length) {
            return { stored: 0, strikeCount: 0, terminated: false };
        }
        await this.prisma.proctoringEvent.createMany({
            data: events.map((e) => ({
                interviewId,
                eventType: e.eventType,
                severity: e.severity ?? 'info',
                payload: (e.payload ?? {}),
                clientTimestamp: e.clientTimestamp
                    ? new Date(e.clientTimestamp)
                    : undefined,
            })),
        });
        const strikeEvents = events.filter((e) => e.severity === 'strike' || e.eventType === 'TAB_SWITCH');
        let terminated = false;
        let strikeCount = 0;
        if (strikeEvents.length) {
            const interview = await this.prisma.interview.update({
                where: { id: interviewId },
                data: { strikeCount: { increment: strikeEvents.length } },
            });
            strikeCount = interview.strikeCount;
            if (strikeCount >= exports.STRIKE_TERMINATE_THRESHOLD) {
                await this.prisma.interview.update({
                    where: { id: interviewId },
                    data: { status: client_1.InterviewStatus.TERMINATED, finishedAt: new Date() },
                });
                terminated = true;
            }
        }
        else {
            const interview = await this.prisma.interview.findUnique({
                where: { id: interviewId },
            });
            strikeCount = interview?.strikeCount ?? 0;
        }
        return { stored: events.length, strikeCount, terminated };
    }
    timeline(interviewId) {
        return this.prisma.proctoringEvent.findMany({
            where: { interviewId },
            orderBy: { receivedAt: 'asc' },
        });
    }
    async recordDisconnect(interviewId) {
        return this.ingestBatch(interviewId, [
            { eventType: 'DISCONNECTED', severity: 'warning' },
        ]);
    }
};
exports.ProctoringService = ProctoringService;
exports.ProctoringService = ProctoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProctoringService);
//# sourceMappingURL=proctoring.service.js.map