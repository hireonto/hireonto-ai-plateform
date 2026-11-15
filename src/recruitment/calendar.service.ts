import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeetProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import type { CompanyIntegrations } from './integrations.types';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async createInterviewEvent(
    companyId: string,
    input: { title: string; scheduledAt: Date; attendeeEmail?: string },
  ): Promise<{ provider: MeetProvider; url: string; eventId: string }> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    const integrations = (company?.integrations ?? {}) as CompanyIntegrations;

    if (integrations.google?.refreshToken) {
      try {
        return await this.createGoogleEvent(integrations.google.refreshToken, input);
      } catch (err) {
        this.logger.warn(`Google Calendar failed: ${err instanceof Error ? err.message : err}`);
      }
    }
    if (integrations.microsoft?.refreshToken) {
      try {
        return await this.createMicrosoftEvent(integrations.microsoft.refreshToken, input);
      } catch (err) {
        this.logger.warn(`Microsoft Calendar failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    return {
      provider: MeetProvider.GOOGLE_MEET,
      url: `${appUrl}/candidate/interview/pending?at=${encodeURIComponent(input.scheduledAt.toISOString())}`,
      eventId: `dev_${randomBytes(8).toString('hex')}`,
    };
  }

  private async googleAccessToken(refreshToken: string): Promise<string> {
    const clientId = this.config.get<string>('google.oauth.clientId');
    const clientSecret = this.config.get<string>('google.oauth.clientSecret');
    if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');
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
    const json = (await res.json()) as { access_token?: string; error?: string };
    if (!res.ok || !json.access_token) throw new Error(json.error ?? 'Google token refresh failed');
    return json.access_token;
  }

  private async createGoogleEvent(
    refreshToken: string,
    input: { title: string; scheduledAt: Date; attendeeEmail?: string },
  ) {
    const accessToken = await this.googleAccessToken(refreshToken);
    const end = new Date(input.scheduledAt.getTime() + 45 * 60_000);
    const requestId = randomBytes(8).toString('hex');
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
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    const event = (await res.json()) as {
      id?: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: Array<{ uri?: string }> };
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(event.error?.message ?? 'Google event create failed');
    const url =
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find((e) => e.uri)?.uri ??
      `https://meet.google.com/lookup/${requestId}`;
    return {
      provider: MeetProvider.GOOGLE_MEET,
      url,
      eventId: event.id ?? `gcal_${requestId}`,
    };
  }

  private async microsoftAccessToken(refreshToken: string): Promise<string> {
    const clientId = this.config.get<string>('microsoft.clientId');
    const clientSecret = this.config.get<string>('microsoft.clientSecret');
    const tenant = this.config.get<string>('microsoft.tenantId') ?? 'common';
    if (!clientId || !clientSecret) throw new Error('Microsoft OAuth not configured');
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
    const json = (await res.json()) as { access_token?: string; error_description?: string };
    if (!res.ok || !json.access_token) throw new Error(json.error_description ?? 'Microsoft token refresh failed');
    return json.access_token;
  }

  private async createMicrosoftEvent(
    refreshToken: string,
    input: { title: string; scheduledAt: Date; attendeeEmail?: string },
  ) {
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
    const event = (await res.json()) as {
      id?: string;
      onlineMeeting?: { joinUrl?: string };
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(event.error?.message ?? 'Microsoft event create failed');
    return {
      provider: MeetProvider.MICROSOFT_TEAMS,
      url: event.onlineMeeting?.joinUrl ?? 'https://teams.microsoft.com/',
      eventId: event.id ?? `teams_${randomBytes(8).toString('hex')}`,
    };
  }
}
