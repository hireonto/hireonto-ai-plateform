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
exports.ConfirmBulkUploadDto = exports.BulkResumeUploadDto = exports.BulkResumeItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class BulkResumeItemDto {
}
exports.BulkResumeItemDto = BulkResumeItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'application/pdf' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkResumeItemDto.prototype, "lastName", void 0);
class BulkResumeUploadDto {
}
exports.BulkResumeUploadDto = BulkResumeUploadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BulkResumeItemDto], maxItems: 50 }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkResumeItemDto),
    __metadata("design:type", Array)
], BulkResumeUploadDto.prototype, "files", void 0);
class ConfirmBulkUploadDto {
}
exports.ConfirmBulkUploadDto = ConfirmBulkUploadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConfirmBulkUploadDto.prototype, "resumeIds", void 0);
//# sourceMappingURL=bulk-upload.dto.js.map