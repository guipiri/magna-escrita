export interface BucketService {
  upload(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<string>;
  get(key: string): Promise<Buffer | null>;
}
