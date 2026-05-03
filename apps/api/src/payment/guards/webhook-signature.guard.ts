import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'node:crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const headers = request.headers as Record<string, any>;
    const xSignature = (headers['x-signature'] ||
      headers['X-Signature']) as string;
    const xRequestId = (headers['x-request-id'] ||
      headers['X-Request-Id']) as string;

    // Obtain Query params related to the request URL
    const query = request.query;
    const dataID = query['data.id'] as string;

    // Separating the x-signature into parts
    const parts = xSignature.split(',');

    // Initializing variables to store ts and hash
    let ts;
    let hash;

    // Iterate over the values to obtain ts and v1
    parts.forEach((part) => {
      // Split each part into key and value
      const [key, value] = part.split('=');
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === 'ts') {
          ts = trimmedValue;
        } else if (trimmedKey === 'v1') {
          hash = trimmedValue;
        }
      }
    });

    // Generate the manifest string
    const manifest = `id:${dataID};request-id:${xRequestId};ts:${ts};`;

    // Create an HMAC signature
    const hmac = crypto.createHmac('sha256', this.webhookSecret as string);
    hmac.update(manifest);

    // Obtain the hash result as a hexadecimal string
    const sha = hmac.digest('hex');

    if (sha !== hash)
      throw new UnauthorizedException('Invalid webhook signature');

    return true;
  }
}
