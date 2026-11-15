"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpProxy = createHttpProxy;
const HttpProxy = require('http-proxy');
function createHttpProxy(options) {
    return HttpProxy.createProxyServer(options);
}
//# sourceMappingURL=http-proxy.js.map