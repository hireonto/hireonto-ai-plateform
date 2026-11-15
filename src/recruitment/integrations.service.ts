import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CompanyIntegrations, IntegrationsStatus } from './integrations.types';

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar.events'].join(' ');
const MS_SCOPES = ['offline_access', 'Calendars.ReadWrite', 'OnlineMeetings.ReadWrite', 'User.Read'].join(' ');

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async status(companyId: string): Promise<IntegrationsStatus> {
    const integrations = await this.loadIntegrations(companyId);
    const twilioSid = this.config.get<string>('twilio.accountSid');
    const twilioFrom = this.config.get<string>('twilio.fromNumber');
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
        configured: !!(twilioSid && this.config.get<string>('twilio.authToken') && twilioFrom),
        fromNumber: twilioFrom || undefined,
      },
    };
  }

  async startGoogleConnect(companyId: string, userId: string) {
    const clientId = this.config.get<string>('google.oauth.clientId');
    const redirectUri = this.config.get<string>('google.oauth.redirectUri');
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth is not configured on the server (GOOGLE_CLIENT_ID / GOOGLE_OAUTH_REDIRECT_URI)');
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

  async startMicrosoftConnect(companyId: string, userId: string) {
    const clientId = this.config.get<string>('microsoft.clientId');
    const redirectUri = this.config.get<string>('microsoft.redirectUri');
    if (!clientId || !redirectUri) {
      throw new BadRequestException('Microsoft OAuth is not configured (MICROSOFT_CLIENT_ID / MICROSOFT_OAUTH_REDIRECT_URI)');
    }
    const state = this.signState({ companyId, userId, provider: 'microsoft' });
    const tenant = this.config.get<string>('microsoft.tenantId') ?? 'common';
    const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', MS_SCOPES);
    url.searchParams.set('state', state);
    return { authorizeUrl: url.toString() };
  }

  async handleGoogleCallback(code: string, state: string) {
    const payload = this.verifyState(state);
    if (payload.provider !== 'google') throw new BadRequestException('Invalid OAuth state');

    const clientId = this.config.get<string>('google.oauth.clientId')!;
    const clientSecret = this.config.get<string>('google.oauth.clientSecret')!;
    const redirectUri = this.config.get<string>('google.oauth.redirectUri')!;

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
    const tokenJson = (await tokenRes.json()) as {
      refresh_token?: string;
      access_token?: string;
      error?: string;
    };
    if (!tokenRes.ok || !tokenJson.refresh_token) {
      this.logger.warn(`Google token exchange failed: ${JSON.stringify(tokenJson)}`);
      throw new BadRequestException(tokenJson.error ?? 'Google did not return a refresh token');
    }

    let email: string | undefined;
    if (tokenJson.access_token) {
      const profile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (profile.ok) {
        const p = (await profile.json()) as { email?: string };
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

  async handleMicrosoftCallback(code: string, state: string) {
    const payload = this.verifyState(state);
    if (payload.provider !== 'microsoft') throw new BadRequestException('Invalid OAuth state');

    const clientId = this.config.get<string>('microsoft.clientId')!;
    const clientSecret = this.config.get<string>('microsoft.clientSecret')!;
    const redirectUri = this.config.get<string>('microsoft.redirectUri')!;
    const tenant = this.config.get<string>('microsoft.tenantId') ?? 'common';

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
    const tokenJson = (await tokenRes.json()) as {
      refresh_token?: string;
      access_token?: string;
      error_description?: string;
    };
    if (!tokenRes.ok || !tokenJson.refresh_token) {
      throw new BadRequestException(tokenJson.error_description ?? 'Microsoft token exchange failed');
    }

    let email: string | undefined;
    if (tokenJson.access_token) {
      const me = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (me.ok) {
        const p = (await me.json()) as { mail?: string; userPrincipalName?: string };
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

  async disconnect(companyId: string, provider: 'google' | 'microsoft') {
    const current = await this.loadIntegrations(companyId);
    if (provider === 'google') delete current.google;
    else delete current.microsoft;
    await this.prisma.company.update({
      where: { id: companyId },
      data: { integrations: current as Prisma.InputJsonValue },
    });
    return { ok: true };
  }

  async loadIntegrations(companyId: string): Promise<CompanyIntegrations> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    return (company?.integrations ?? {}) as CompanyIntegrations;
  }

  private async mergeIntegrations(companyId: string, patch: CompanyIntegrations) {
    const current = await this.loadIntegrations(companyId);
    const next = { ...current, ...patch };
    await this.prisma.company.update({
      where: { id: companyId },
      data: { integrations: next as Prisma.InputJsonValue },
    });
  }

  private signState(payload: { companyId: string; userId: string; provider: string }) {
    return this.jwt.sign({ ...payload, typ: 'oauth_state' }, { expiresIn: '15m' });
  }

  private verifyState(state: string) {
    try {
      const decoded = this.jwt.verify<{ companyId: string; userId: string; provider: string; typ?: string }>(state);
      if (decoded.typ !== 'oauth_state') throw new Error('bad typ');
      return decoded;
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  private redirectAfterConnect(provider: string) {
    const appUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3000';
    return { redirectUrl: `${appUrl}/settings?connected=${provider}` };
  }
}
