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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SttController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const http_proxy_1 = require("../common/http-proxy");
const public_decorator_1 = require("../common/decorators/public.decorator");
let SttController = class SttController {
    constructor(config) {
        this.config = config;
        this.proxy = (0, http_proxy_1.createHttpProxy)({ ws: true, changeOrigin: true });
    }
    proxyRequest(req, res) {
        const target = this.config.get('ai.serviceUrl') ?? 'http://localhost:8000';
        const path = req.url.replace(/^\/ai\/stt/, '/stt');
        req.url = path;
        this.proxy.web(req, res, { target }, (err) => {
            res.status(502).json({ error: err?.message ?? 'STT proxy error' });
        });
    }
};
exports.SttController = SttController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.All)('*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SttController.prototype, "proxyRequest", null);
exports.SttController = SttController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('ai/stt'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SttController);
//# sourceMappingURL=stt.controller.js.map