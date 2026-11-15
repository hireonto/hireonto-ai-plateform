import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let sdk: NodeSDK | undefined;

export function startTracing() {
  if (process.env.OTEL_ENABLED !== 'true') {
    return;
  }
  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
}

export async function shutdownTracing() {
  await sdk?.shutdown();
}
