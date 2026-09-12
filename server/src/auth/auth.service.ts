import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { INITIAL_CASH } from "../portfolio/portfolio.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { hashPassword, verifyPassword } from "./users.js";

export const loginRequestSchema = z.strictObject({
  email: z
    .string({ error: "email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "email must be a valid address" })),
  password: z
    .string({ error: "password is required" })
    .min(1, { error: "password is required" }),
});

export const signupRequestSchema = z.strictObject({
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(1, { error: "name is required" })
    .max(60, { error: "name must be 60 characters or fewer" }),
  email: loginRequestSchema.shape.email,
  password: z
    .string({ error: "password is required" })
    .min(8, { error: "password must be at least 8 characters" }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;

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
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login({ email, password }: LoginRequest): Promise<AuthResponse> {
    const account = await this.prisma.user.findUnique({ where: { email } });
    if (!account || !verifyPassword(password, account.passwordHash)) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: "Unauthorized",
        errorCode: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }

    const user: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
    };
    return {
      accessToken: await this.jwt.signAsync(
        { email: user.email, name: user.name },
        { subject: user.id },
      ),
      user,
    };
  }

  // A new account opens with the same starting cash as the demo ones, but no positions.
  async signup({ name, email, password }: SignupRequest): Promise<AuthResponse> {
    let user: AuthUser;
    try {
      user = await this.prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          name,
          passwordHash: hashPassword(password),
          cashBalance: INITIAL_CASH,
        },
        select: { id: true, email: true, name: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          statusCode: 409,
          error: "Conflict",
          errorCode: "EMAIL_TAKEN",
          message: "An account with that email already exists.",
        });
      }
      throw error;
    }

    return {
      accessToken: await this.jwt.signAsync(
        { email: user.email, name: user.name },
        { subject: user.id },
      ),
      user,
    };
  }
}
