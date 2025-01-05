import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // 토큰 파싱
  parseBasicToken(rawToken: string) {
    // @todo 1.토큰을 " "기준으로 스플릿하여 토큰 추출
    const basicSplit = rawToken.split(" ");

    if (basicSplit.length !== 2) {
      throw new BadRequestException(
        "토큰 포맷이 잘못되었습니다.",
      );
    }
    const [_, token] = basicSplit;

    // @todo 2.토큰을 base64 디코딩하여 email와 password 추출

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
      this.configService.get<number>("HASH_ROUNDS"),
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

  async login(rawToken: string) {
    const { email, password } =
      this.parseBasicToken(rawToken);

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

    const accessTokenSecret =
      this.configService.get<string>("ACCESS_TOKEN_SECRET");

    const refreshTokenSecret =
      this.configService.get<string>(
        "REFRESH_TOKEN_SECRET",
      );

    return {
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: "access",
        },
        {
          secret: accessTokenSecret,
          expiresIn: 300,
        },
      ),
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: "refresh",
        },
        {
          secret: refreshTokenSecret,
          expiresIn: "24h",
        },
      ),
    };
  }
}
