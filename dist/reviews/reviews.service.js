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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(interviewId, companyId) {
        return this.prisma.review.findMany({
            where: { interviewId, interview: { companyId } },
            include: {
                reviewer: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    createStaffReview(interviewId, companyId, reviewerId, score, comments) {
        return this.prisma.review.create({
            data: {
                interviewId,
                reviewerId,
                score,
                comments,
            },
        });
    }
    async createGuestLink(interviewId, companyId, ttlHours = 72) {
        const interview = await this.prisma.interview.findFirst({
            where: { id: interviewId, companyId },
        });
        if (!interview) {
            throw new common_1.NotFoundException('Interview not found');
        }
        const token = (0, crypto_1.randomBytes)(24).toString('hex');
        return this.prisma.guestLink.create({
            data: {
                companyId,
                interviewId,
                token,
                expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000),
            },
        });
    }
    async submitGuestReview(token, score, comments) {
        const link = await this.prisma.guestLink.findFirst({
            where: { token, expiresAt: { gt: new Date() } },
        });
        if (!link) {
            throw new common_1.NotFoundException('Invalid or expired guest link');
        }
        return this.prisma.review.create({
            data: {
                interviewId: link.interviewId,
                guestLinkId: link.id,
                score,
                comments,
            },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map