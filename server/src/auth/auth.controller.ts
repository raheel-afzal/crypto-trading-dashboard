import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type AuthResponse,
  AuthService,
  type LoginRequest,
  loginRequestSchema,
  type SignupRequest,
  signupRequestSchema,
} from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(
    @Body({ schema: loginRequestSchema }) request: LoginRequest,
  ): Promise<AuthResponse> {
    return this.auth.login(request);
  }

  @Post("signup")
  signup(
    @Body({ schema: signupRequestSchema }) request: SignupRequest,
  ): Promise<AuthResponse> {
    return this.auth.signup(request);
  }
}
