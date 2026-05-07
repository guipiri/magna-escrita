import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../db/db.service.js';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { AuthResponse, AuthUser } from '@repo/shared';
import { GoogleAuthDto } from './dto/google-auth.dto.js';
import {
  UnauthorizedAccessToBackofficeException,
  UnauthorizedMissingGoogleAuthTokenException,
  UnauthorizedInvalidGoogleTokenException,
  UnauthorizedInvalidGoogleAuthCodeException,
  UnauthorizedInvalidTokenException,
  UnauthorizedUserNotFoundException,
} from './auth.erros.js';

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private googleClientId: string;
  private googleClientSecret: string;
  private googleRedirectUri: string;
  private jwtSecret: string;
  private jwtExpiresInMilliseconds: number | undefined;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.googleClientId =
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.googleClientSecret = this.configService.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    this.googleRedirectUri =
      this.configService.get<string>('GOOGLE_AUTH_REDIRECT_URI') ??
      'postmessage';
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiresInMilliseconds =
      this.configService.get<number>('JWT_EXPIRES_IN');
    this.googleClient = new OAuth2Client(
      this.googleClientId,
      this.googleClientSecret,
      this.googleRedirectUri,
    );
  }

  async authenticateWithGoogle(g: GoogleAuthDto) {
    if (g.idToken) return await this.authenticateWithGoogleIdToken(g.idToken);

    if (g.code) return await this.authenticateWithGoogleAuthCode(g.code);

    throw new UnauthorizedMissingGoogleAuthTokenException();
  }

  async authenticateWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email)
      throw new UnauthorizedInvalidGoogleTokenException();

    const { sub, email, name, picture } = payload;

    const user = await this.prismaService.user.upsert({
      where: { googleId: sub },
      update: { email, name, picture },
      create: { googleId: sub, email, name, picture },
    });

    const role = user.role.toString();

    const token = jwt.sign({ sub, email, name, role }, this.jwtSecret, {
      expiresIn: Number(this.jwtExpiresInMilliseconds) || '7d',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Magnífico usuário',
        picture: user.picture,
        role: user.role as UserRole,
      },
      token,
    };
  }

  async authenticateWithGoogleAuthCode(code: string): Promise<AuthResponse> {
    try {
      const { tokens } = await this.googleClient.getToken({
        code,
        redirect_uri: this.googleRedirectUri,
      });

      if (!tokens.id_token)
        throw new UnauthorizedInvalidGoogleAuthCodeException();

      return await this.authenticateWithGoogleIdToken(tokens.id_token);
    } catch {
      throw new UnauthorizedInvalidGoogleAuthCodeException();
    }
  }

  async getUserFromToken(token: string): Promise<AuthUser> {
    let decoded: JwtClaims;

    try {
      const verified = jwt.verify(token, this.jwtSecret);
      decoded = typeof verified === 'string' ? {} : verified;
    } catch {
      throw new UnauthorizedInvalidTokenException();
    }

    if (!decoded.sub) throw new UnauthorizedInvalidTokenException();

    const user = await this.prismaService.user.findUnique({
      where: { googleId: decoded.sub },
    });

    if (!user) throw new UnauthorizedUserNotFoundException();

    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Magnífico usuário',
      picture: user.picture,
      role: user.role as UserRole,
    };
  }

  async backofficeLoginWithGoogle(g: GoogleAuthDto) {
    const authResult = await this.authenticateWithGoogle(g);

    if (
      !authResult.user.role ||
      (authResult.user.role !== UserRole.ADMIN &&
        authResult.user.role !== UserRole.SCHOOL)
    )
      throw new UnauthorizedAccessToBackofficeException();

    return authResult;
  }
}
