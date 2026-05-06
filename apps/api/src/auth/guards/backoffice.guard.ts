import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service.js';
import { AuthUser } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

@Injectable()
export class BackofficeGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const cookieName = process.env.AUTH_COOKIE_NAME || 'magna_auth';
    const token = request.cookies?.[cookieName] as string | undefined;

    if (!token) throw new ForbiddenException('Missing auth token');

    const user = await this.authService.getUserFromToken(token);
    request.user = user;

    const allowed =
      user?.role &&
      (user.role === UserRole.SCHOOL || user.role === UserRole.ADMIN);

    if (!allowed) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
