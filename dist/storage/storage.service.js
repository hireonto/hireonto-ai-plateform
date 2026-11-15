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
exports.StorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let StorageService = class StorageService {
    constructor(config) {
        this.config = config;
        const endpoint = this.config.get('s3.endpoint');
        this.bucket = this.config.get('s3.bucket') ?? 'hiremind';
        this.client = new client_s3_1.S3Client({
            region: this.config.get('s3.region') ?? 'us-east-1',
            endpoint,
            forcePathStyle: Boolean(endpoint),
            credentials: {
                accessKeyId: this.config.get('s3.accessKey') ?? 'minioadmin',
                secretAccessKey: this.config.get('s3.secretKey') ?? 'minioadmin',
            },
        });
    }
    resumeKey(companyId, fileName) {
        const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `companies/${companyId}/resumes/${(0, crypto_1.randomUUID)()}-${safe}`;
    }
    jdKey(companyId, jobId, fileName) {
        const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `companies/${companyId}/jobs/${jobId}/jd/${safe}`;
    }
    questionBankKey(companyId, jobId, fileName) {
        const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        return `companies/${companyId}/jobs/${jobId}/questions/${safe}`;
    }
    async presignedPut(key, contentType, expiresSec = 900) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
            expiresIn: expiresSec,
        });
        return { url, key, bucket: this.bucket, expiresIn: expiresSec };
    }
    async presignedGet(key, expiresSec = 900) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: expiresSec });
        return url;
    }
    async createMultipartUpload(key, contentType) {
        const command = new client_s3_1.CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const result = await this.client.send(command);
        return { uploadId: result.UploadId, key, bucket: this.bucket };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map