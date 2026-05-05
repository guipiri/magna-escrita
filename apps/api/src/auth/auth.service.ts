/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../db/db.service.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture?: string | null;
}

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private googleClientId: string;
  private jwtSecret: string;
  private jwtExpiresInMilliseconds: number | undefined;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.googleClientId =
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiresInMilliseconds =
      this.configService.get<number>('JWT_EXPIRES_IN');
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async authenticateWithGoogle(
    idToken: string,
  ): Promise<{ user: AuthUser; token: string }> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { sub, email, name, picture } = payload;

    const user = await this.prismaService.user.upsert({
      where: { googleId: sub },
      update: { email, name, picture },
      create: { googleId: sub, email, name, picture },
    });

    const token = jwt.sign({ sub, email, name }, this.jwtSecret, {
      expiresIn: Number(this.jwtExpiresInMilliseconds) || '7d',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token,
    };
  }

  async getUserFromToken(token: string): Promise<AuthUser> {
    let decoded: JwtClaims;

    try {
      const verified = jwt.verify(token, this.jwtSecret);
      decoded = typeof verified === 'string' ? {} : verified;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (!decoded.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prismaService.user.findUnique({
      where: { googleId: decoded.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }
}
