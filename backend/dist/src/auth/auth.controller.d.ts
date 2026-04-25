import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
    }>;
    login(body: {
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
    me(req: {
        user: {
            sub: string;
            email: string;
            role: string;
        };
    }): Promise<{
        id: string;
        email: string;
        role: string;
        name: string;
    }>;
}
