import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOperation,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Authorization } from "./decorator/authorization.decorator";
import { Public } from "./decorator/public.decorator";
import { JwtAuthGuard } from "./strategy/jwt.strategy";
import { LocalAuthGuard } from "./strategy/local.strategy";

@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBasicAuth()
  @Public()
  @Post("register")
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }

  @ApiBasicAuth()
  @Public()
  @Post("login")
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  // 특정 사용자 차단/토큰 블락
  @Post("token-block")
  @ApiOperation({
    description: "특정 사용자 차단/토큰(관리자용)",
  })
  blockToken(@Body("token") token: string) {
    console.log("token", token);
    return this.authService.tokenBlock(token);
  }

  // 토큰 재발급
  @Post("reissue-accessToken")
  @ApiOperation({
    description: "accessToken 재발급",
  })
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
