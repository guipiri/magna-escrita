import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import { AuthService } from './auth.service.js';

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
    const { user, token } = await this.authService.authenticateWithGoogle(
      body.idToken,
    );

    response.cookie(this.getCookieName(), token, this.getCookieOptions());

    return { user };
  }

  @Get('me')
  async getMe(@Req() request: Request) {
    const token: string | undefined = request.cookies?.[
      this.getCookieName()
    ] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    const user = await this.authService.getUserFromToken(token);

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
