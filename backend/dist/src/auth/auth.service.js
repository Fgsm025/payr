"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async register(input) {
        const existing = await this.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already exists');
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
    async login(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (!user || user.password !== input.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async me(user) {
        const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub } });
        return {
            id: user.sub,
            email: user.email,
            role: user.role,
            name: dbUser?.name ?? 'Admin User',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map