import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from './auth.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

function unauthorized(message: string): UnauthorizedException {
  return new UnauthorizedException({ statusCode: 401, error: 'Unauthorized', errorCode: 'UNAUTHENTICATED', message });
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw unauthorized('Sign in to continue.');

    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token);
      request.user = { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      throw unauthorized('Your session has expired. Sign in again.');
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
