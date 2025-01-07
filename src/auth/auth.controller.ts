import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./decorator/public.decorator";
import { JwtAuthGuard } from "./strategy/jwt.strategy";
import { LocalAuthGuard } from "./strategy/local.strategy";

@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  registerUser(@Headers("authorization") token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post("login")
  loginUser(@Headers("authorization") token: string) {
    return this.authService.login(token);
  }

  @Post("reissue-accessToken")
  async rotateAccessToken(@Request() req) {
    console.log("req.user", req.user);

    this.authService.validateRefreshToken(req.user.type);

    return {
      accessToken: await this.authService.issueToken(
        req.user,
        false,
      ),
    };
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

  @UseGuards(JwtAuthGuard)
  @Get("private")
  async privateRequest(@Request() req) {
    return req.user;
  }
}
