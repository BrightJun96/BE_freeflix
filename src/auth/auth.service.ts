import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import {
  BadRequestException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { CACHE_KEY } from "../shared/const/cache-key.const";
import { envVariablesKeys } from "../shared/const/env.const";
import { Role, User } from "../user/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // 토큰 파싱
  parseBasicToken(rawToken: string) {
    // 토큰을 " "기준으로 스플릿하여 토큰 추출
    const basicSplit = rawToken.split(" ");

    if (basicSplit.length !== 2) {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }
    const [BASIC, token] = basicSplit;

    if (BASIC.toLowerCase() !== "basic") {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }

    // 토큰을 base64 디코딩하여 email와 password 추출

    const decoded = Buffer.from(token, "base64").toString(
      "utf-8",
    );

    // email:password
    const tokenSplit = decoded.split(":");

    if (tokenSplit.length !== 2) {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  // rawToken => Basic Token
  async register(rawToken: string) {
    const { email, password } =
      this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException(
        "이미 존재하는 이메일입니다.",
      );
    }

    // 해싱 암호화
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(
        envVariablesKeys.HASH_ROUNDS,
      ),
    );

    // 해싱된 암호로 저장
    await this.userRepository.save({
      email,
      password: hash,
    });

    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException(
        "잘못된 로그인 정보입니다. ",
      );
    }

    const passOk = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passOk) {
      throw new BadRequestException(
        "잘못된 로그인 정보입니다. ",
      );
    }

    return user;
  }

  async issueToken(
    user: {
      id: number;
      role: Role;
    },
    isRefreshToken: boolean,
  ) {
    const accessTokenSecret =
      this.configService.get<string>(
        envVariablesKeys.ACCESS_TOKEN_SECRET,
      );

    const refreshTokenSecret =
      this.configService.get<string>(
        envVariablesKeys.REFRESH_TOKEN_SECRET,
      );
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? "refresh" : "access",
      },
      {
        secret: isRefreshToken
          ? refreshTokenSecret
          : accessTokenSecret,
        expiresIn: isRefreshToken ? "24h" : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } =
      this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      accessToken: await this.issueToken(user, false),
      refreshToken: await this.issueToken(user, true),
    };
  }

  // 리프래쉬 토큰 여부 검증(엑세스 토큰 재발급 API에 사용)
  validateRefreshToken(tokenType: string) {
    if (tokenType !== "refresh") {
      throw new BadRequestException(
        "리프래쉬 토큰이 아닙니다.",
      );
    }
  }

  // 토큰 블락
  async blockToken(token: string) {
    const decodedPayload = this.jwtService.decode(token);

    // 만료시간
    const exp = decodedPayload["exp"] * 1000;
    // 현재시간
    const now = Date.now();
    // 만료시간 - 현재시간
    const differenceInSeconds = (exp - now) / 1000;
    // 만료시간 - 현재시간 - 30초
    const TTL = Math.max(differenceInSeconds * 1000, 1);

    await this.cacheManager.set(
      CACHE_KEY.BLOCKED_TOKEN(token),
      decodedPayload,
      TTL,
    );

    return true;
  }
}
