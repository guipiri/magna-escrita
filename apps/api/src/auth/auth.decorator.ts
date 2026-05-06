import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@repo/shared';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: AuthUser;
}

/**
 * Extracts the authenticated user from the request. Ensure to use with AuthGuard:
 *
 * \@UseGuards(AuthGuard)
 *
 * async getMe(\@User() user: AuthUser) {
 *
 *   return { user };
 *
 * }
 */
export const User = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
