// 이메일과 비밀번호로 로그인하는 전략
import { Injectable } from "@nestjs/common";
import {
  AuthGuard,
  PassportStrategy,
} from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

export class LocalAuthGuard extends AuthGuard("local") {}
@Injectable()
export class LocalStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: "email",
    });
  }

  /**
   * LocalStrategy
   *
   * @param email 이메일
   * @param password 비밀번호
   *
   * @returns -> Request() 객체
   */
  async validate(email: string, password: string) {
    return await this.authService.authenticate(
      email,
      password,
    );
  }
}
