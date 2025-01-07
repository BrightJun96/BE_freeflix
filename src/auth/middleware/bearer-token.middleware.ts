import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction } from "express";
import { envVariablesKeys } from "../../shared/const/env.const";

type ExtendedRequest = Request & {
  user: {};
};

@Injectable()
export class BearerTokenMiddleware
  implements NestMiddleware
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Bearer 토큰 파싱
  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(" ");

    if (bearerSplit.length !== 2) {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }

    const [BEARER, token] = bearerSplit;

    if (BEARER.toLowerCase() !== "bearer") {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }

    return token;
  }

  // 토큰 타입 검증
  validateTokenType(token: string) {
    try {
      const decodedPayload = this.jwtService.decode(token);

      if (!decodedPayload) {
        throw new BadRequestException("잘못된 토큰입니다.");
      }

      if (
        decodedPayload.type !== "access" &&
        decodedPayload.type !== "refresh"
      ) {
        throw new BadRequestException("잘못된 토큰입니다.");
      }

      return decodedPayload.type;
    } catch (e) {
      throw e;
    }
  }

  // token secret 조회
  getTokenSecret(tokenType: string) {
    return this.configService.get<string>(
      tokenType === "refresh"
        ? envVariablesKeys.REFRESH_TOKEN_SECRET
        : envVariablesKeys.ACCESS_TOKEN_SECRET,
    );
  }

  // 토큰 검증 및 request에 user 저장
  async verifyToken(token: string, secret: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret,
      });
    } catch (e) {
      throw new UnauthorizedException(
        "토큰이 만료되었습니다.",
      );
    }
  }

  async use(
    req: Request & {
      user: {
        // id: number;
      };
    },
    res: Response,
    next: NextFunction,
  ) {
    // 헤더에 값있음?
    const authHeader = req.headers["authorization"];

    // 없으면 다음 미들웨어로
    if (!authHeader) {
      return next();
    }

    const token = this.validateBearerToken(authHeader);

    try {
      const tokenType = this.validateTokenType(token);

      const secret = this.getTokenSecret(tokenType);

      req.user = await this.verifyToken(token, secret);

      next();
    } catch (e) {
      throw e;
      // next();
      // throw new UnauthorizedException(
      //   "토큰이 만료되었습니다.",
      // );
    }
  }
}
