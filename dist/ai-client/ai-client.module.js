"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiClientModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const ai_client_service_1 = require("./ai-client.service");
const interview_context_service_1 = require("./interview-context.service");
let AiClientModule = class AiClientModule {
};
exports.AiClientModule = AiClientModule;
exports.AiClientModule = AiClientModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        providers: [ai_client_service_1.AiClientService, interview_context_service_1.InterviewContextService],
        exports: [ai_client_service_1.AiClientService, interview_context_service_1.InterviewContextService],
    })
], AiClientModule);
//# sourceMappingURL=ai-client.module.js.map