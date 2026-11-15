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
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let CalendarService = CalendarService_1 = class CalendarService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(CalendarService_1.name);
    }
    async createInterviewEvent(companyId, input) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        const integrations = (company?.integrations ?? {});
        if (integrations.google?.refreshToken) {
            try {
                return await this.createGoogleEvent(integrations.google.refreshToken, input);
            }
            catch (err) {
                this.logger.warn(`Google Calendar failed: ${err instanceof Error ? err.message : err}`);
            }
        }
        if (integrations.microsoft?.refreshToken) {
            try {
                return await this.createMicrosoftEvent(integrations.microsoft.refreshToken, input);
            }
            catch (err) {
                this.logger.warn(`Microsoft Calendar failed: ${err instanceof Error ? err.message : err}`);
            }
        }
        const appUrl = this.config.get('appUrl') ?? 'http://localhost:3000';
        return {
            provider: client_1.MeetProvider.GOOGLE_MEET,
            url: `${appUrl}/candidate/interview/pending?at=${encodeURIComponent(input.scheduledAt.toISOString())}`,
            eventId: `dev_${(0, crypto_1.randomBytes)(8).toString('hex')}`,
        };
    }
    async googleAccessToken(refreshToken) {
        const clientId = this.config.get('google.oauth.clientId');
        const clientSecret = this.config.get('google.oauth.clientSecret');
        if (!clientId || !clientSecret)
            throw new Error('Google OAuth not configured');
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        const json = (await res.json());
        if (!res.ok || !json.access_token)
            throw new Error(json.error ?? 'Google token refresh failed');
        return json.access_token;
    }
    async createGoogleEvent(refreshToken, input) {
        const accessToken = await this.googleAccessToken(refreshToken);
        const end = new Date(input.scheduledAt.getTime() + 45 * 60_000);
        const requestId = (0, crypto_1.randomBytes)(8).toString('hex');
        const body = {
            summary: input.title,
            start: { dateTime: input.scheduledAt.toISOString() },
            end: { dateTime: end.toISOString() },
            attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : [],
            conferenceData: {
                createRequest: {
                    requestId,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const event = (await res.json());
        if (!res.ok)
            throw new Error(event.error?.message ?? 'Google event create failed');
        const url = event.hangoutLink ??
            event.conferenceData?.entryPoints?.find((e) => e.uri)?.uri ??
            `https://meet.google.com/lookup/${requestId}`;
        return {
            provider: client_1.MeetProvider.GOOGLE_MEET,
            url,
            eventId: event.id ?? `gcal_${requestId}`,
        };
    }
    async microsoftAccessToken(refreshToken) {
        const clientId = this.config.get('microsoft.clientId');
        const clientSecret = this.config.get('microsoft.clientSecret');
        const tenant = this.config.get('microsoft.tenantId') ?? 'common';
        if (!clientId || !clientSecret)
            throw new Error('Microsoft OAuth not configured');
        const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                scope: 'offline_access Calendars.ReadWrite OnlineMeetings.ReadWrite User.Read',
            }),
        });
        const json = (await res.json());
        if (!res.ok || !json.access_token)
            throw new Error(json.error_description ?? 'Microsoft token refresh failed');
        return json.access_token;
    }
    async createMicrosoftEvent(refreshToken, input) {
        const accessToken = await this.microsoftAccessToken(refreshToken);
        const end = new Date(input.scheduledAt.getTime() + 45 * 60_000);
        const body = {
            subject: input.title,
            start: { dateTime: input.scheduledAt.toISOString(), timeZone: 'UTC' },
            end: { dateTime: end.toISOString(), timeZone: 'UTC' },
            isOnlineMeeting: true,
            onlineMeetingProvider: 'teamsForBusiness',
            attendees: input.attendeeEmail
                ? [{ emailAddress: { address: input.attendeeEmail }, type: 'required' }]
                : [],
        };
        const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const event = (await res.json());
        if (!res.ok)
            throw new Error(event.error?.message ?? 'Microsoft event create failed');
        return {
            provider: client_1.MeetProvider.MICROSOFT_TEAMS,
            url: event.onlineMeeting?.joinUrl ?? 'https://teams.microsoft.com/',
            eventId: event.id ?? `teams_${(0, crypto_1.randomBytes)(8).toString('hex')}`,
        };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map