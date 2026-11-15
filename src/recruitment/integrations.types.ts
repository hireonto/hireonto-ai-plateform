export type GoogleIntegration = {
  refreshToken: string;
  email?: string;
  connectedAt?: string;
};

export type MicrosoftIntegration = {
  refreshToken: string;
  email?: string;
  connectedAt?: string;
};

export type CompanyIntegrations = {
  google?: GoogleIntegration;
  microsoft?: MicrosoftIntegration;
};

export type IntegrationsStatus = {
  google: { connected: boolean; email?: string };
  microsoft: { connected: boolean; email?: string };
  twilio: { configured: boolean; fromNumber?: string };
};
