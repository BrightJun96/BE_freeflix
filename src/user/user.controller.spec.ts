import { Test, TestingModule } from "@nestjs/testing";
import { describe } from "node:test";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

const mockedUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe("UserController", () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [UserController],
        providers: [
          {
            provide: UserService,
            useValue: mockedUserService,
          },
        ],
      }).compile();

    userController =
      module.get<UserController>(UserController);

    userService = module.get<UserService>(UserService);
  });

  /**
   * 이거 왜 하는거지? => userController 정의 확인
   */
  it("should be defined", () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  /**
   * 유저 생성
   */
  describe("create", () => {
    it("should call And Return userService.create", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const result = {
        ...createUserDto,
        id: 1,
        password: "sdfsdfsdfsdfsdfdsd",
      };

      jest
        .spyOn(userService, "create")
        .mockResolvedValue(result as User);

      const user =
        await userController.create(createUserDto);

      expect(userService.create).toHaveBeenCalledWith(
        createUserDto,
      );

      expect(user).toEqual(result);
    });
  });

  /**
   * 유저 목록
   */
  describe("findAll", () => {
    it("should return userService.findAll and users", async () => {
      const users = [
        {
          id: 1,
          email: "test@codefactory.ai",
        },
      ];
      jest
        .spyOn(userService, "findAll")
        .mockResolvedValue(users as User[]);

      const result = await userController.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  /**
   * 유저 상세
   */

  describe("findOne", () => {
    it("should return userService.findOne and a user", async () => {
      const user = {
        id: 1,
        email: "test@codefacotry.ai",
      };

      const userId = 1;

      jest
        .spyOn(userService, "findOne")
        .mockResolvedValue(user as User);

      const result = await userController.findOne(userId);

      expect(userService.findOne).toHaveBeenCalledWith(
        userId,
      );

      expect(result).toEqual(user);
    });
  });

  /**
   * 유저 업데이트
   */
  describe("update", () => {
    it("should return userService.update and update a user", async () => {
      const updateUserDto: UpdateUserDto = {
        email: "test@codefactory.ai",
        password: "12341234",
      };

      const userId = 1;

      const user = {
        ...updateUserDto,
        id: userId,
      };

      jest
        .spyOn(userService, "update")
        .mockResolvedValue(user as User);

      const result = await userController.update(
        userId,
        updateUserDto,
      );

      expect(userService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );

      expect(result).toEqual(user);
    });
  });

  /**
   * 유저 삭제
   */
  describe("remove", () => {
    it("should return userService.remove and remove a user", async () => {
      const userId = 1;

      jest
        .spyOn(userService, "remove")
        .mockResolvedValue(userId);

      const result = await userController.remove(userId);

      expect(result).toEqual(userId);

      expect(userService.remove).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
