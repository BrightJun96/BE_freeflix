import {
  ClassSerializerInterceptor,
  Controller,
  Headers,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./strategy/local.strategy";

@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  registerUser(@Headers("authorization") token: string) {
    return this.authService.register(token);
  }

  @Post("login")
  loginUser(@Headers("authorization") token: string) {
    return this.authService.login(token);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login/passport")
  // local.strategy.ts 파일의 validate() 메서드에서 반환한 객체가 Request 객체로 전달됨
  async loginUserPassport(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(
        req.user,
        false,
      ),
      refreshToken: await this.authService.issueToken(
        req.user,
        true,
      ),
    };
  }
}
