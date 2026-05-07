import { WebhookSignatureGuard } from './webhook-signature.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('WebhookSignatureGuard', () => {
  let guard: WebhookSignatureGuard;
  const webhookSecret = 'test_secret_key';

  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = webhookSecret;
    guard = new WebhookSignatureGuard();
  });

  afterEach(() => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should validate correct webhook signature', () => {
    const xRequestId = '2066ca19-c6f1-498a-be75-1923005edd06';
    const dataId = 'ORD01JQ4S4KY8HWQ6NA5PXB65B3D3';
    const ts = String(Date.now());

    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
    const v1 = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');
    const xSignature = `ts=${ts},v1=${v1}`;

    const mockRequest = {
      headers: {
        'x-request-id': xRequestId,
        'x-signature': xSignature,
      },
      query: {
        'data.id': dataId,
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });

  it('should reject invalid webhook signature', () => {
    const mockRequest = {
      headers: {
        'x-request-id': '1234567890',
        'x-signature': 'ts=123,v1=invalid_signature',
      },
      query: {
        'data.id': 'ORD01',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject missing x-request-id header', () => {
    const mockRequest = {
      headers: {
        'x-signature': 'ts=123,v1=some_signature',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject missing v1 in x-signature header', () => {
    const mockRequest = {
      headers: {
        'x-request-id': '1234567890',
        'x-signature': 'ts=123',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should reject when webhook secret is not configured', () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

    const mockRequest = {
      headers: {
        'x-request-id': '1234567890',
        'x-signature': 'ts=123,v1=some_signature',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });
});
