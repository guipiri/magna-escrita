import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service.js';
import type { AuthUser } from '@repo/shared';
import { ForbiddenMissingAuthTokenException } from './guards.errors.js';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const cookieName =
      this.configService.getOrThrow<string>('AUTH_COOKIE_NAME');
    const token = request.cookies?.[cookieName] as string | undefined;

    if (!token) throw new ForbiddenMissingAuthTokenException();

    const user = await this.authService.getUserFromToken(token);
    request.user = user;

    return true;
  }
}
