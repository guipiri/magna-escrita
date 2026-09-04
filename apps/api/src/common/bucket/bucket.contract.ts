export interface BucketService {
  upload(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  getPresignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string>;
}
