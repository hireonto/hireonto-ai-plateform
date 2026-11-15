"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, config, notifications) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.notifications = notifications;
    }
    async staffLogin(email, password) {
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase(), deletedAt: null },
        });
        if (!user?.passwordHash || user.status === client_1.UserStatus.DISABLED) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.issueStaffTokens(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (payload.type !== 'refresh' || payload.aud !== 'staff') {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findFirst({
            where: { id: payload.sub, deletedAt: null },
        });
        if (!user?.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Session expired');
        }
        const hash = this.hashToken(refreshToken);
        if (hash !== user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Session expired');
        }
        return this.issueStaffTokens(user);
    }
    async acceptInvite(token, password) {
        const user = await this.prisma.user.findFirst({
            where: {
                inviteToken: token,
                inviteExpiresAt: { gt: new Date() },
                deletedAt: null,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired invite');
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                status: client_1.UserStatus.ACTIVE,
                inviteToken: null,
                inviteExpiresAt: null,
            },
        });
        return this.issueStaffTokens(updated);
    }
    async requestPasswordReset(email) {
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase(), deletedAt: null },
        });
        if (!user) {
            return { sent: true };
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        await this.notifications.sendPasswordReset({
            companyId: user.companyId,
            to: user.email,
            resetUrl: `${appUrl}/reset-password?token=${token}`,
        });
        return { sent: true };
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpiresAt: { gt: new Date() },
                deletedAt: null,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetExpiresAt: null,
                refreshTokenHash: null,
            },
        });
    }
    async candidateMagicLink(email, interviewToken) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { email: email.toLowerCase(), deletedAt: null },
        });
        if (!candidate) {
            return { sent: true };
        }
        if (interviewToken) {
            const interview = await this.prisma.interview.findFirst({
                where: { accessToken: interviewToken, candidateId: candidate.id },
            });
            if (!interview) {
                return { sent: true };
            }
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.candidate.update({
            where: { id: candidate.id },
            data: {
                magicLinkToken: token,
                magicLinkExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        return { sent: true };
    }
    async candidateLogin(token, tempPassword) {
        const candidate = await this.prisma.candidate.findFirst({
            where: {
                magicLinkToken: token,
                magicLinkExpiresAt: { gt: new Date() },
                deletedAt: null,
            },
        });
        if (!candidate) {
            throw new common_1.UnauthorizedException('Invalid or expired link');
        }
        if (candidate.tempPasswordHash) {
            if (!tempPassword) {
                throw new common_1.UnauthorizedException('Temporary password required');
            }
            const valid = await bcrypt.compare(tempPassword, candidate.tempPasswordHash);
            if (!valid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
        }
        await this.prisma.candidate.update({
            where: { id: candidate.id },
            data: { magicLinkToken: null, magicLinkExpiresAt: null },
        });
        return this.issueCandidateTokens(candidate);
    }
    async candidateInterviewPreview(accessToken) {
        const interview = await this.prisma.interview.findFirst({
            where: { accessToken, deletedAt: null },
            include: {
                job: { select: { title: true } },
                company: {
                    select: { name: true, logoUrl: true, primaryColor: true, secondaryColor: true },
                },
            },
        });
        if (!interview) {
            throw new common_1.BadRequestException('Invalid interview link');
        }
        return {
            status: interview.status,
            windowEnd: interview.windowEnd,
            jobTitle: interview.job.title,
            company: interview.company,
        };
    }
    async candidateInterviewLogin(accessToken, tempPassword) {
        const interview = await this.prisma.interview.findFirst({
            where: { accessToken, deletedAt: null },
            include: { candidate: true },
        });
        const hash = interview?.candidate.tempPasswordHash;
        if (!interview || !hash || interview.candidate.deletedAt) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(tempPassword, hash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.issueCandidateTokens(interview.candidate);
        return { ...tokens, interviewId: interview.id };
    }
    async issueStaffTokens(user) {
        const accessPayload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role,
            aud: 'staff',
            type: 'access',
        };
        const refreshPayload = { ...accessPayload, type: 'refresh' };
        const accessTtl = this.config.get('jwt.accessTtl') ?? '15m';
        const refreshTtl = this.config.get('jwt.refreshTtl') ?? '7d';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(accessPayload, {
                secret: this.config.get('jwt.accessSecret'),
                expiresIn: accessTtl,
            }),
            this.jwt.signAsync(refreshPayload, {
                secret: this.config.get('jwt.refreshSecret'),
                expiresIn: refreshTtl,
            }),
        ]);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshTokenHash: this.hashToken(refreshToken) },
        });
        return { accessToken, refreshToken, expiresIn: accessTtl };
    }
    async issueCandidateTokens(candidate) {
        const accessPayload = {
            sub: candidate.id,
            email: candidate.email ?? '',
            companyId: candidate.companyId,
            role: 'CANDIDATE',
            aud: 'candidate',
            type: 'access',
        };
        const refreshPayload = { ...accessPayload, type: 'refresh' };
        const accessTtl = this.config.get('jwt.accessTtl') ?? '15m';
        const refreshTtl = '24h';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(accessPayload, {
                secret: this.config.get('jwt.accessSecret'),
                expiresIn: accessTtl,
            }),
            this.jwt.signAsync(refreshPayload, {
                secret: this.config.get('jwt.refreshSecret'),
                expiresIn: refreshTtl,
            }),
        ]);
        return { accessToken, refreshToken, expiresIn: accessTtl };
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map