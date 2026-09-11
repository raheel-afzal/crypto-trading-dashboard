import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { USERS, verifyPassword } from './users.js';

export const loginRequestSchema = z.strictObject({
  email: z
    .string({ error: 'email is required' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'email must be a valid address' })),
  password: z.string({ error: 'password is required' }).min(1, { error: 'password is required' }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    const account = USERS.find((user) => user.email === email);
    if (!account || !verifyPassword(password, account.passwordHash)) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      });
    }

    const user: AuthUser = { id: account.id, email: account.email, name: account.name };
    return {
      accessToken: await this.jwt.signAsync({ email: user.email, name: user.name }, { subject: user.id }),
      user,
    };
  }
}
