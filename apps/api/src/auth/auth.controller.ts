import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { User } from './auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import { BadRequestMissingGoogleAuthTokenException } from './auth.erros.js';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('google')
  async googleSignIn(
    @Body() body: GoogleAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.idToken && !body.code)
      throw new BadRequestMissingGoogleAuthTokenException();

    const { user, token } = await this.authService.authenticateWithGoogle(body);

    response.cookie(this.getCookieName(), token, this.getCookieOptions());

    return { user };
  }

  @Post('backoffice/google')
  async backofficeGoogleSignIn(
    @Body() body: GoogleAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.idToken && !body.code)
      throw new BadRequestMissingGoogleAuthTokenException();

    const { user, token } =
      await this.authService.backofficeLoginWithGoogle(body);

    response.cookie(this.getCookieName(), token, this.getCookieOptions());

    return { user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@User() user: AuthUser) {
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(this.getCookieName(), this.getCookieOptions());
    return { ok: true };
  }

  private getCookieName() {
    return this.configService.getOrThrow<string>('AUTH_COOKIE_NAME');
  }

  private getCookieOptions() {
    const isProd =
      (this.configService.get<string>('NODE_ENV') ?? 'development') ===
      'production';
    const maxAgeDays = this.configService.getOrThrow<number>(
      'AUTH_COOKIE_MAX_AGE_DAYS',
    );

    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }
}
