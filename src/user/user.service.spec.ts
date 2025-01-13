import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { describe } from "node:test";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";

const mockUserRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe("UserService", () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          UserService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
        ],
      }).compile();

    userService = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

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

  describe("remove", () => {
    it("should remove a user by id", async () => {
      const user = {
        id: 1,
        email: "test@codefactory.ai",
      };

      jest
        .spyOn(mockUserRepository, "delete")
        .mockResolvedValue(1);

      const userId = await userService.remove(user.id);

      expect(userId).toEqual(user.id);
      expect(
        mockUserRepository.delete,
      ).toHaveBeenCalledWith(user.id);
    });
  });
});
