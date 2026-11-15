"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const ai_client_module_1 = require("../ai-client/ai-client.module");
const auth_module_1 = require("../auth/auth.module");
const jobs_module_1 = require("../jobs/jobs.module");
const storage_module_1 = require("../storage/storage.module");
const candidates_constants_1 = require("./candidates.constants");
const candidates_controller_1 = require("./candidates.controller");
const candidates_processor_1 = require("./candidates.processor");
const candidates_service_1 = require("./candidates.service");
let CandidatesModule = class CandidatesModule {
};
exports.CandidatesModule = CandidatesModule;
exports.CandidatesModule = CandidatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            storage_module_1.StorageModule,
            jobs_module_1.JobsModule,
            ai_client_module_1.AiClientModule,
            bullmq_1.BullModule.registerQueue({ name: candidates_constants_1.RESUME_PARSE_QUEUE }),
        ],
        controllers: [candidates_controller_1.CandidatesController],
        providers: [candidates_service_1.CandidatesService, candidates_processor_1.CandidatesProcessor],
        exports: [candidates_service_1.CandidatesService],
    })
], CandidatesModule);
//# sourceMappingURL=candidates.module.js.map