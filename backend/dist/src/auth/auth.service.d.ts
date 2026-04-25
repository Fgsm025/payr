import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly jwtService;
    private readonly prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    register(input: {
        email: string;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
    }>;
    login(input: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    }>;
    me(user: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        name: string;
    }>;
}
