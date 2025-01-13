import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { afterEach, describe } from "node:test";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
          {
            provide: UserService,
            useValue: mockUserService,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: CACHE_MANAGER,
            useValue: mockCacheManager,
          },
        ],
      }).compile();

    authService = module.get<AuthService>(AuthService);

    userService = module.get<UserService>(UserService);

    jwtService = module.get<JwtService>(JwtService);

    userRepository = module.get<Repository<User>>(
      getRepositoryToken(User),
    );

    configService =
      module.get<ConfigService>(ConfigService);

    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it("should be defined", () => {
    expect(authService).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("tokenBlock", () => {
    it("should block a token", async () => {
      const token = "token";
      const payload = {
        exp: Math.floor(Date.now() * 1000) + 60,
      };

      jest
        .spyOn(jwtService, "decode")
        .mockReturnValue(payload);

      await authService.tokenBlock(token);

      expect(jwtService.decode).toHaveBeenCalledWith(token);

      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCKED_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe("parseBasicToken", () => {
    it("should parse basicToken from rawToken to object which has email and password", async () => {
      const rawToken =
        "Basic dGVzdEBjb2RlZmFjdG9yeS5haTp0ZXN0dGVzdA==";

      const decoded = {
        email: "test@codefactory.ai",
        password: "testtest",
      };

      const result = authService.parseBasicToken(rawToken);

      expect(result).toEqual(decoded);
    });

    it("should throw an error if invalid token format because not match length", () => {
      const rawToken = "invalidToken";

      expect(() =>
        authService.parseBasicToken(rawToken),
      ).toThrow(BadRequestException);
    });

    it("should throw an error if invalid token format because no Basic", () => {
      const rawToken = "Bearer invalidToken";

      expect(() =>
        authService.parseBasicToken(rawToken),
      ).toThrow(BadRequestException);
    });

    it("should throw an error if invalid token format ", () => {
      const rawToken = "basic a";

      expect(() =>
        authService.parseBasicToken(rawToken),
      ).toThrow(BadRequestException);
    });
  });
});
