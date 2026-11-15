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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma, notifications, config) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.config = config;
    }
    list(companyId) {
        return this.prisma.user.findMany({
            where: { companyId, deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async invite(companyId, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { companyId, email: dto.email.toLowerCase(), deletedAt: null },
        });
        if (existing) {
            throw new common_1.ConflictException('User already exists');
        }
        const inviteToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const user = await this.prisma.user.create({
            data: {
                companyId,
                email: dto.email.toLowerCase(),
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role,
                status: client_1.UserStatus.INVITED,
                inviteToken,
                inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                inviteToken: true,
                company: { select: { name: true } },
            },
        });
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        await this.notifications.sendStaffInvite({
            companyId,
            to: user.email,
            companyName: user.company.name,
            role: user.role,
            acceptUrl: `${appUrl}/accept-invite?token=${inviteToken}`,
        });
        const { company, ...rest } = user;
        void company;
        return rest;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                        primaryColor: true,
                        secondaryColor: true,
                        timezone: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { passwordHash, refreshTokenHash, resetToken, inviteToken, ...safe } = user;
        void passwordHash;
        void refreshTokenHash;
        void resetToken;
        void inviteToken;
        return safe;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map