import {
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('s3.endpoint');
    this.bucket = this.config.get<string>('s3.bucket') ?? 'hiremind';
    this.client = new S3Client({
      region: this.config.get<string>('s3.region') ?? 'us-east-1',
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: this.config.get<string>('s3.accessKey') ?? 'minioadmin',
        secretAccessKey: this.config.get<string>('s3.secretKey') ?? 'minioadmin',
      },
    });
  }

  resumeKey(companyId: string, fileName: string): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `companies/${companyId}/resumes/${randomUUID()}-${safe}`;
  }

  jdKey(companyId: string, jobId: string, fileName: string): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `companies/${companyId}/jobs/${jobId}/jd/${safe}`;
  }

  questionBankKey(companyId: string, jobId: string, fileName: string): string {
    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `companies/${companyId}/jobs/${jobId}/questions/${safe}`;
  }

  async presignedPut(key: string, contentType: string, expiresSec = 900) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresSec,
    });
    return { url, key, bucket: this.bucket, expiresIn: expiresSec };
  }

  async presignedGet(key: string, expiresSec = 900) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresSec });
    return url;
  }

  async createMultipartUpload(key: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const result = await this.client.send(command);
    return { uploadId: result.UploadId, key, bucket: this.bucket };
  }
}
