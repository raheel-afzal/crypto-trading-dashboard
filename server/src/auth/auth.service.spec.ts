import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { INITIAL_CASH } from '../portfolio/portfolio.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService, loginRequestSchema, signupRequestSchema } from './auth.service.js';
import { USERS } from './users.js';

interface Account {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  cashBalance?: number;
}

// Only the two queries the service runs are stubbed; hashing and signing stay real.
function prismaWith(accounts: Account[]): PrismaService {
  return {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) =>
        accounts.find((account) => account.email === where.email) ?? null,
      create: async ({ data }: { data: Account }) => {
        if (accounts.some((account) => account.email === data.email)) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }
        accounts.push(data);
        return { id: data.id, email: data.email, name: data.name };
      },
    },
  } as unknown as PrismaService;
}

describe('AuthService', () => {
  let jwt: JwtService;
  let accounts: Account[];
  let auth: AuthService;

  beforeEach(() => {
    jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    accounts = [...USERS];
    auth = new AuthService(jwt, prismaWith(accounts));
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

  it('opens a new account with the starting cash and signs it in', async () => {
    const { accessToken, user } = await auth.signup({ name: 'Sam Rivera', email: 'sam@trading.dev', password: 'sam12345' });

    expect(user).toMatchObject({ email: 'sam@trading.dev', name: 'Sam Rivera' });
    expect(await jwt.verifyAsync<{ sub: string }>(accessToken)).toMatchObject({ sub: user.id });
    expect(accounts.at(-1)?.cashBalance).toBe(INITIAL_CASH);
  });

  it('lets a new account sign in with the password it chose', async () => {
    await auth.signup({ name: 'Sam Rivera', email: 'sam@trading.dev', password: 'sam12345' });

    const { user } = await auth.login({ email: 'sam@trading.dev', password: 'sam12345' });
    expect(user.name).toBe('Sam Rivera');
  });

  it('rejects an email that is already registered', async () => {
    await expect(auth.signup({ name: 'Impostor', email: 'demo@trading.dev', password: 'demo1234' })).rejects.toThrow(
      expect.objectContaining({ status: 409, response: expect.objectContaining({ errorCode: 'EMAIL_TAKEN' }) }),
    );
    await expect(auth.signup({ name: 'Impostor', email: 'demo@trading.dev', password: 'demo1234' })).rejects.toThrow(
      ConflictException,
    );
  });

  it.each([
    [{ name: '  ', email: 'sam@trading.dev', password: 'sam12345' }, 'name is required'],
    [{ name: 'Sam Rivera', email: 'sam@trading.dev', password: 'short' }, 'password must be at least 8 characters'],
    [{ name: 'Sam Rivera', email: 'not-an-email', password: 'sam12345' }, 'email must be a valid address'],
  ])('rejects malformed signup details %j', (input, message) => {
    expect(signupRequestSchema.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});
