import { Module } from '@nestjs/common';
import { CloudflareR2Service } from './providers/cloudflare-r2.service.js';

@Module({
  providers: [
    {
      provide: 'BucketService',
      useClass: CloudflareR2Service,
    },
  ],
  exports: ['BucketService'],
})
export class BucketModule {}
