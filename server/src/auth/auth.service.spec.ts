import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService, loginRequestSchema } from './auth.service.js';

describe('AuthService', () => {
  let jwt: JwtService;
  let auth: AuthService;

  beforeEach(() => {
    jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    auth = new AuthService(jwt);
  });

  it('issues a token that identifies the signed-in user', async () => {
    const { accessToken, user } = await auth.login({ email: 'demo@trading.dev', password: 'demo1234' });

    expect(user).toEqual({ id: 'demo', email: 'demo@trading.dev', name: 'Demo Trader' });
    expect(await jwt.verifyAsync<{ sub: string; name: string }>(accessToken)).toMatchObject({
      sub: 'demo',
      name: 'Demo Trader',
    });
  });

  it('rejects a wrong password', async () => {
    await expect(auth.login({ email: 'demo@trading.dev', password: 'nope' })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an unknown account with a machine-readable code', async () => {
    await expect(auth.login({ email: 'stranger@trading.dev', password: 'demo1234' })).rejects.toThrow(
      expect.objectContaining({ status: 401, response: expect.objectContaining({ errorCode: 'INVALID_CREDENTIALS' }) }),
    );
  });

  it('trims and lowercases the submitted email', () => {
    expect(loginRequestSchema.parse({ email: '  DEMO@Trading.dev ', password: 'demo1234' }).email).toBe('demo@trading.dev');
  });

  it.each([
    [{ email: 'not-an-email', password: 'demo1234' }, 'email must be a valid address'],
    [{ email: 'demo@trading.dev', password: '' }, 'password is required'],
    [{ password: 'demo1234' }, 'email is required'],
  ])('rejects malformed credentials %j', (input, message) => {
    expect(loginRequestSchema.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});
