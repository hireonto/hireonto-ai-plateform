"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const privacy_constants_1 = require("./privacy.constants");
const privacy_controller_1 = require("./privacy.controller");
const privacy_processor_1 = require("./privacy.processor");
const privacy_service_1 = require("./privacy.service");
let PrivacyModule = class PrivacyModule {
};
exports.PrivacyModule = PrivacyModule;
exports.PrivacyModule = PrivacyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, bullmq_1.BullModule.registerQueue({ name: privacy_constants_1.PRIVACY_QUEUE })],
        controllers: [privacy_controller_1.PrivacyController],
        providers: [privacy_service_1.PrivacyService, privacy_processor_1.PrivacyProcessor],
    })
], PrivacyModule);
//# sourceMappingURL=privacy.module.js.map