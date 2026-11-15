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
var IntegrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'].join(' ');
const MS_SCOPES = ['offline_access', 'Calendars.ReadWrite', 'OnlineMeetings.ReadWrite', 'User.Read'].join(' ');
let IntegrationsService = IntegrationsService_1 = class IntegrationsService {
    constructor(prisma, config, jwt) {
        this.prisma = prisma;
        this.config = config;
        this.jwt = jwt;
        this.logger = new common_1.Logger(IntegrationsService_1.name);
    }
    async status(companyId) {
        const integrations = await this.loadIntegrations(companyId);
        const twilioSid = this.config.get('twilio.accountSid');
        const twilioFrom = this.config.get('twilio.fromNumber');
        return {
            google: {
                connected: !!integrations.google?.refreshToken,
                email: integrations.google?.email,
            },
            microsoft: {
                connected: !!integrations.microsoft?.refreshToken,
                email: integrations.microsoft?.email,
            },
            twilio: {
                configured: !!(twilioSid && this.config.get('twilio.authToken') && twilioFrom),
                fromNumber: twilioFrom || undefined,
            },
        };
    }
    async startGoogleConnect(companyId, userId) {
        const clientId = this.config.get('google.oauth.clientId');
        const redirectUri = this.config.get('google.oauth.redirectUri');
        if (!clientId || !redirectUri) {
            throw new common_1.BadRequestException('Google OAuth is not configured on the server (GOOGLE_CLIENT_ID / GOOGLE_OAUTH_REDIRECT_URI)');
        }
        const state = this.signState({ companyId, userId, provider: 'google' });
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', GOOGLE_SCOPES);
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
        url.searchParams.set('state', state);
        return { authorizeUrl: url.toString() };
    }
    async startMicrosoftConnect(companyId, userId) {
        const clientId = this.config.get('microsoft.clientId');
        const redirectUri = this.config.get('microsoft.redirectUri');
        if (!clientId || !redirectUri) {
            throw new common_1.BadRequestException('Microsoft OAuth is not configured (MICROSOFT_CLIENT_ID / MICROSOFT_OAUTH_REDIRECT_URI)');
        }
        const state = this.signState({ companyId, userId, provider: 'microsoft' });
        const tenant = this.config.get('microsoft.tenantId') ?? 'common';
        const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', MS_SCOPES);
        url.searchParams.set('state', state);
        return { authorizeUrl: url.toString() };
    }
    async handleGoogleCallback(code, state) {
        const payload = this.verifyState(state);
        if (payload.provider !== 'google')
            throw new common_1.BadRequestException('Invalid OAuth state');
        const clientId = this.config.get('google.oauth.clientId');
        const clientSecret = this.config.get('google.oauth.clientSecret');
        const redirectUri = this.config.get('google.oauth.redirectUri');
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokenJson = (await tokenRes.json());
        if (!tokenRes.ok || !tokenJson.refresh_token) {
            this.logger.warn(`Google token exchange failed: ${JSON.stringify(tokenJson)}`);
            throw new common_1.BadRequestException(tokenJson.error ?? 'Google did not return a refresh token');
        }
        let email;
        if (tokenJson.access_token) {
            const profile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenJson.access_token}` },
            });
            if (profile.ok) {
                const p = (await profile.json());
                email = p.email;
            }
        }
        await this.mergeIntegrations(payload.companyId, {
            google: {
                refreshToken: tokenJson.refresh_token,
                email,
                connectedAt: new Date().toISOString(),
            },
        });
        return this.redirectAfterConnect('google');
    }
    async handleMicrosoftCallback(code, state) {
        const payload = this.verifyState(state);
        if (payload.provider !== 'microsoft')
            throw new common_1.BadRequestException('Invalid OAuth state');
        const clientId = this.config.get('microsoft.clientId');
        const clientSecret = this.config.get('microsoft.clientSecret');
        const redirectUri = this.config.get('microsoft.redirectUri');
        const tenant = this.config.get('microsoft.tenantId') ?? 'common';
        const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const tokenJson = (await tokenRes.json());
        if (!tokenRes.ok || !tokenJson.refresh_token) {
            throw new common_1.BadRequestException(tokenJson.error_description ?? 'Microsoft token exchange failed');
        }
        let email;
        if (tokenJson.access_token) {
            const me = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${tokenJson.access_token}` },
            });
            if (me.ok) {
                const p = (await me.json());
                email = p.mail ?? p.userPrincipalName;
            }
        }
        await this.mergeIntegrations(payload.companyId, {
            microsoft: {
                refreshToken: tokenJson.refresh_token,
                email,
                connectedAt: new Date().toISOString(),
            },
        });
        return this.redirectAfterConnect('microsoft');
    }
    async disconnect(companyId, provider) {
        const current = await this.loadIntegrations(companyId);
        if (provider === 'google')
            delete current.google;
        else
            delete current.microsoft;
        await this.prisma.company.update({
            where: { id: companyId },
            data: { integrations: current },
        });
        return { ok: true };
    }
    async loadIntegrations(companyId) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        return (company?.integrations ?? {});
    }
    async mergeIntegrations(companyId, patch) {
        const current = await this.loadIntegrations(companyId);
        const next = { ...current, ...patch };
        await this.prisma.company.update({
            where: { id: companyId },
            data: { integrations: next },
        });
    }
    signState(payload) {
        return this.jwt.sign({ ...payload, typ: 'oauth_state' }, { expiresIn: '15m' });
    }
    verifyState(state) {
        try {
            const decoded = this.jwt.verify(state);
            if (decoded.typ !== 'oauth_state')
                throw new Error('bad typ');
            return decoded;
        }
        catch {
            throw new common_1.BadRequestException('Invalid or expired OAuth state');
        }
    }
    redirectAfterConnect(provider) {
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        return { redirectUrl: `${appUrl}/settings?connected=${provider}` };
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = IntegrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map