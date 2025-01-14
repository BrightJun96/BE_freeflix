import { Test, TestingModule } from "@nestjs/testing";
import { describe } from "node:test";
import { Role, User } from "../user/entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  validateRefreshToken: jest.fn(),
  issueToken: jest.fn(),
};

describe("AuthController", () => {
  let authController: AuthController;
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: mockAuthService,
          },
        ],
      }).compile();

    authController =
      module.get<AuthController>(AuthController);

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(authController).toBeDefined();
  });

  describe("registerUser", () => {
    it("should register a user through basic Token", async () => {
      const user = {
        id: 1,
        role: Role.admin,
      };

      const token = "Basic token";

      jest
        .spyOn(authService, "register")
        .mockResolvedValue(user as User);

      const result =
        await authController.registerUser(token);

      expect(authService.register).toHaveBeenCalledWith(
        token,
      );

      expect(result).toEqual(user);
    });
  });

  describe("loginUser", () => {
    it("should login an user through basic Token", async () => {
      const token = "Basic token";

      const accessToken = "access";
      const refreshToken = "refresh";

      jest.spyOn(authService, "login").mockResolvedValue({
        accessToken,
        refreshToken,
      });

      const result = await authController.loginUser(token);

      expect(authService.login).toHaveBeenCalledWith(token);

      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
    });
  });

  describe("blockToken", () => {
    it("should block token from bad user", async () => {
      const token = "basic token";

      jest
        .spyOn(authService, "tokenBlock")
        .mockResolvedValue(true);

      const result = await authController.blockToken(token);

      expect(authService.tokenBlock).toHaveBeenCalledWith(
        token,
      );

      expect(result).toEqual(true);
    });
  });

  describe("rotateAccessToken", () => {
    beforeEach(() => {});

    it("should issue accessToken through refreshToken if accessToken expires or no exists", async () => {
      const user = {
        id: 1,
        role: Role.admin,
        type: "refresh",
      };

      const request = {
        user,
      };
      const accessToken = "accessToken";

      jest
        .spyOn(authService, "issueToken")
        .mockResolvedValue(accessToken);

      const result =
        await authController.rotateAccessToken(request);

      expect(authService.issueToken).toHaveBeenCalledWith(
        user,
        false,
      );

      expect(result).toEqual({ accessToken });
    });
  });

  describe("loginUserPassport", () => {
    it("should login through passport", async () => {
      const user = {
        id: 1,
        role: Role.admin,
        type: "refresh",
      };

      const request = {
        user,
      };

      const accessToken = "accessToken";
      const refreshToken = "refreshToken";

      jest
        .spyOn(authService, "issueToken")
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      const result =
        await authController.loginUserPassport(request);

      expect(authService.issueToken).toHaveBeenCalledTimes(
        2,
      );
      expect(
        authService.issueToken,
      ).toHaveBeenNthCalledWith(1, user, false);

      expect(
        authService.issueToken,
      ).toHaveBeenNthCalledWith(2, user, true);

      expect(result).toEqual({
        accessToken,
        refreshToken,
      });
    });
  });
});
