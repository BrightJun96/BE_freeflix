import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { describe } from "node:test";
import { Repository } from "typeorm";
import { Role, User } from "../user/entities/user.entity";
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
  let userRepository: Repository<User>;
  let userService: UserService;
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

  describe("register", () => {
    it("should register a user by passing email and password parsed from token", async () => {
      const rawToken =
        "Basic dGVzdEBjb2RlZmFjdG9yeS5haTp0ZXN0dGVzdA==";

      const user = {
        email: "test@codefactory.ai",
        password: "testtest",
      };

      jest
        .spyOn(authService, "parseBasicToken")
        .mockReturnValue(user);

      const result = authService.parseBasicToken(rawToken);

      expect(result).toEqual(user);
      expect(
        authService.parseBasicToken,
      ).toHaveBeenCalledWith(rawToken);

      jest
        .spyOn(userService, "create")
        .mockResolvedValue(user as User);

      const createdUser = await userService.create(
        result as User,
      );

      expect(userService.create).toHaveBeenCalledWith(
        result,
      );

      const registerResult =
        await authService.register(rawToken);

      expect(registerResult).toEqual(createdUser);
    });
  });

  describe("authenticate", () => {
    it("should authenticate user", async () => {
      const user = {
        email: "test@codefactory.ai",
        password: "testtest",
      };

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValue(user as User);

      const userFromRepo = await userRepository.findOne({
        where: {
          email: user.email,
        },
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: user.email,
        },
      });

      expect(userFromRepo).toEqual(user);

      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation((pw, userPw) => true);

      await bcrypt.compare(
        user.password,
        userFromRepo.password,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        user.password,
        userFromRepo.password,
      );

      const result = await authService.authenticate(
        user.email,
        user.password,
      );

      expect(result).toEqual(user as User);
    });

    it("should throw an error if user is not found", async () => {
      const userInfo = {
        email: "test@codefactory.ai",
        password: "testtest",
      };

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        authService.authenticate(
          userInfo.email,
          userInfo.password,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw an error if password does not match", async () => {
      const userInfo = {
        email: "test@codefactory.ai",
        password: "testtest",
      };

      jest
        .spyOn(userRepository, "findOne")
        .mockResolvedValue(userInfo as User);

      jest
        .spyOn(bcrypt, "compare")
        .mockImplementation((repoPW, userPW) => false);

      await expect(
        authService.authenticate(
          userInfo.email,
          userInfo.password,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("issueToken", () => {
    const user = {
      id: 1,
      role: Role.admin,
    };

    const token = "Sdfsdfvsdfgsdfgsdfgdf";
    beforeEach(() => {
      jest
        .spyOn(configService, "get")
        .mockReturnValue("secret");

      jest
        .spyOn(jwtService, "signAsync")
        .mockResolvedValue(token);
    });

    it("should issue access token through user Info", async () => {
      const result = await authService.issueToken(
        user,
        false,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 1,
          role: Role.admin,
          type: "access",
        },
        {
          secret: "secret",
          expiresIn: 300,
        },
      );

      expect(result).toEqual(token);
    });

    it("should issue refresh token through user Info", async () => {
      const result = await authService.issueToken(
        user,
        true,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 1,
          role: Role.admin,
          type: "refresh",
        },
        {
          secret: "secret",
          expiresIn: "24h",
        },
      );

      expect(result).toEqual(token);
    });
  });

  describe("login", () => {
    it("should login through rawToken", async () => {
      const rawToken = "Basic sdfsdf";

      const authInfo = {
        email: "test@codefactory.ai",
        password: "1234",
      };

      const user = {
        id: 1,
        role: Role.admin,
      };

      const mockedToken = "mockToken";
      jest
        .spyOn(authService, "parseBasicToken")
        .mockReturnValue(authInfo);
      jest
        .spyOn(authService, "authenticate")
        .mockResolvedValue(user as User);

      jest
        .spyOn(authService, "issueToken")
        .mockResolvedValue("mockToken");

      const result = await authService.login(rawToken);

      expect(
        authService.parseBasicToken,
      ).toHaveBeenCalledWith(rawToken);

      expect(authService.authenticate).toHaveBeenCalledWith(
        authInfo.email,
        authInfo.password,
      );
      expect(authService.issueToken).toHaveBeenCalledTimes(
        2,
      );

      expect(result).toEqual({
        accessToken: mockedToken,
        refreshToken: mockedToken,
      });
    });
  });

  describe("validateRefreshToken", () => {
    it("should throw an error if token is not refreshToken", () => {
      expect(() =>
        authService.validateRefreshToken("access"),
      ).toThrow(BadRequestException);
    });
  });
});
