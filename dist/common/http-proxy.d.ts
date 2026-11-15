import type { ServerOptions } from 'http-proxy';
declare const HttpProxy: {
    createProxyServer(options?: ServerOptions): {
        web: (req: unknown, res: unknown, options: {
            target: string;
        }, callback?: (err: Error | null | undefined) => void) => void;
        ws: (req: unknown, socket: unknown, head: unknown, options: {
            target: string;
        }) => void;
    };
};
export type HttpProxyServer = ReturnType<typeof HttpProxy.createProxyServer>;
export declare function createHttpProxy(options?: ServerOptions): HttpProxyServer;
export {};
