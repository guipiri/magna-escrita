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

    if (!xRequestId || !xSignature) {
      throw new UnauthorizedException(
        'Missing required webhook headers (x-request-id, x-signature)',
      );
    }

    if (!this.webhookSecret) {
      throw new UnauthorizedException(
        'Webhook secret not configured (MERCADOPAGO_WEBHOOK_SECRET)',
      );
    }

    const parts = xSignature.split(',');
    let ts: string | undefined;
    let v1: string | undefined;
    for (const part of parts) {
      const [k, v] = part.split('=', 2).map((s) => s && s.trim());
      if (k === 'ts') ts = v;
      if (k === 'v1') v1 = v;
    }

    if (!v1) {
      throw new UnauthorizedException(
        'Invalid x-signature header (missing v1)',
      );
    }

    const query = request.query || {};
    let dataIdRaw: string | undefined;
    if (typeof query['data.id'] === 'string') dataIdRaw = query['data.id'];

    const dataId = dataIdRaw ? String(dataIdRaw).toLowerCase() : undefined;

    const segments: string[] = [];
    if (dataId) segments.push(`id:${dataId}`);
    if (xRequestId) segments.push(`request-id:${xRequestId}`);
    if (ts) segments.push(`ts:${ts}`);
    const manifest = segments.length > 0 ? `${segments.join(';')};` : '';

    const computed = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    if (computed !== v1) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (ts) {
      const tsNum = parseInt(ts, 10);
      if (!isNaN(tsNum)) {
        const now = Date.now();
        const delta = Math.abs(now - tsNum);
        const maxDelta = 5 * 60 * 1000; // 5 minutos
        if (delta > maxDelta) {
          throw new UnauthorizedException(
            'Webhook timestamp outside tolerance',
          );
        }
      }
    }

    return true;
  }
}
