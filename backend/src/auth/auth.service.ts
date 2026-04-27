import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: { email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: input.password,
        name: input.email.split('@')[0] || 'Admin User',
        role: 'admin',
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || user.password !== input.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresInSeconds = 60 * 60 * 8;
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      expiresIn: expiresInSeconds,
    });

    return {
      accessToken,
      expiresIn: expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async me(user: { sub: string; email: string; role: string }) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
      name: dbUser?.name ?? 'Admin User',
    };
  }
}
