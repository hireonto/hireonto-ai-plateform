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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanFeaturesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_FEATURES = {
    sourcing_agent: true,
    pstn_outbound: true,
    calendar_sync: true,
    multi_round: true,
};
let PlanFeaturesService = class PlanFeaturesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async featuresForCompany(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: { plan: true },
        });
        const raw = (company?.plan.features ?? {});
        return {
            sourcing_agent: raw.sourcing_agent ?? DEFAULT_FEATURES.sourcing_agent,
            pstn_outbound: raw.pstn_outbound ?? DEFAULT_FEATURES.pstn_outbound,
            calendar_sync: raw.calendar_sync ?? DEFAULT_FEATURES.calendar_sync,
            multi_round: raw.multi_round ?? DEFAULT_FEATURES.multi_round,
        };
    }
    async require(companyId, feature) {
        const f = await this.featuresForCompany(companyId);
        if (!f[feature]) {
            throw new common_1.ForbiddenException(`Plan does not include feature: ${feature}`);
        }
    }
};
exports.PlanFeaturesService = PlanFeaturesService;
exports.PlanFeaturesService = PlanFeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanFeaturesService);
//# sourceMappingURL=plan-features.service.js.map