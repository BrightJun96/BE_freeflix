import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { describe } from "node:test";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";

const mockUserRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe("UserService", () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          UserService,
          ConfigService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

  /**
   * 유저 생성 테스트
   */
  describe("create", () => {
    it("should create a user and return it", async () => {
      const user: CreateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const hashedPassword = "hashedPassword";

      const hashrounds = 10;

      const result = {
        id: 1,
        email: user.email,
        password: hashedPassword,
      };

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValueOnce(null);

      jest
        .spyOn(mockConfigService, "get")
        .mockReturnValue(hashrounds);

      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(
          (password, hashrounds) => hashedPassword,
        );
      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValueOnce(result);

      const createdUser = await userService.create(user);

      expect(createdUser).toEqual(result);
      expect(
        mockUserRepository.findOne,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          email: user.email,
        },
      });

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          email: user.email,
        },
      });

      expect(mockConfigService.get).toHaveBeenCalledWith(
        expect.anything(),
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        user.password,
        hashrounds,
      );

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: user.email,
        password: hashedPassword,
      });
    });

    it("should throw a BadRequestException if user already exists", async () => {
      const user: CreateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue({
          id: 1,
          email: user.email,
        });

      await expect(
        userService.create(user),
      ).rejects.toThrow(BadRequestException);

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          email: user.email,
        },
      });
    });
  });

  /**
   * 유저 목록 테스트
   */
  describe("findAll", () => {
    it("should return an array of users", async () => {
      const users = [
        {
          id: 1,
          email: "test@codefactory.ai",
        },
      ];

      mockUserRepository.find.mockResolvedValue(users);
      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  /**
   * 유저 하나 테스트
   */
  describe("findOne", () => {
    it("should return a user by id", async () => {
      const user = {
        id: 1,
        email: "test@codefactory.ai",
      };

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it("should throw a NotFoundException if user is not found", async () => {
      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        userService.findOne(999),
      ).rejects.toThrow(NotFoundException);

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });

  /**
   * 유저 업데이트 테스트
   */
  describe("update", () => {
    it("should update a user by id if it exists and return updated user", async () => {
      const updateUserDto: UpdateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const firstFindResult = {
        id: 1,
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const updatedResult = {
        id: 1,
        email: "test@jjalseufactory.ai",
      };

      const hashedPassword = "sdfsdfsdfsdfsdfs";

      const hashedRounds = 10;

      const userId = 1;

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValueOnce(firstFindResult);

      jest
        .spyOn(mockConfigService, "get")
        .mockReturnValue(hashedRounds);

      jest
        .spyOn(bcrypt, "hash")
        .mockImplementation(
          (password, hassrounds) => hashedPassword,
        );

      jest
        .spyOn(mockUserRepository, "update")
        .mockResolvedValue({
          ...updatedResult,
          password: hashedPassword,
        });

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValueOnce({
          ...updatedResult,
          password: hashedPassword,
        });

      const result = await userService.update(
        userId,
        updateUserDto,
      );

      expect(result).toEqual({
        ...updatedResult,
        password: hashedPassword,
      });

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          id: userId,
        },
      });

      expect(mockConfigService.get).toHaveBeenCalledWith(
        expect.anything(),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        hashedRounds,
      );

      expect(
        mockUserRepository.update,
      ).toHaveBeenCalledWith(userId, {
        ...updateUserDto,
        password: hashedPassword,
      });

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          id: userId,
        },
      });
    });

    it("should throw a NotFoundException if user to update is not found", async () => {
      const updateUserDto: UpdateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const userId = 1;
      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        userService.update(userId, updateUserDto),
      ).rejects.toThrow(NotFoundException);

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
    });
  });

  /**
   * 유저 제거 테스트
   */
  describe("remove", () => {
    it("should remove a user by id", async () => {
      const user = {
        id: 1,
        email: "test@codefactory.ai",
      };

      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue(user);

      const result = await userService.remove(1);
      expect(result).toEqual(1);

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(
        mockUserRepository.delete,
      ).toHaveBeenCalledWith(1);
    });

    it("should throw a NotFoundException if user to delete is not found", async () => {
      jest
        .spyOn(mockUserRepository, "findOne")
        .mockResolvedValue(null);

      await expect(userService.remove(999)).rejects.toThrow(
        NotFoundException,
      );

      expect(
        mockUserRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });
  });
});
