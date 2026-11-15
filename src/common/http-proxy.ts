/* http-proxy is CJS */
import type { ServerOptions } from 'http-proxy';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const HttpProxy = require('http-proxy') as {
  createProxyServer(options?: ServerOptions): {
    web: (
      req: unknown,
      res: unknown,
      options: { target: string },
      callback?: (err: Error | null | undefined) => void,
    ) => void;
    ws: (
      req: unknown,
      socket: unknown,
      head: unknown,
      options: { target: string },
    ) => void;
  };
};

export type HttpProxyServer = ReturnType<typeof HttpProxy.createProxyServer>;

export function createHttpProxy(options?: ServerOptions): HttpProxyServer {
  return HttpProxy.createProxyServer(options);
}
