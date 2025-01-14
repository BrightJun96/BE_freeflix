import { Test, TestingModule } from "@nestjs/testing";
import { describe } from "node:test";
import { DirectorController } from "./director.controller";
import { DirectorService } from "./director.service";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { Director } from "./entities/director.entity";

const mockDirectorService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe("DirectorController", () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [DirectorController],
        providers: [
          {
            provide: DirectorService,
            useValue: mockDirectorService,
          },
        ],
      }).compile();

    directorController = module.get<DirectorController>(
      DirectorController,
    );

    directorService =
      module.get<DirectorService>(DirectorService);
  });

  it("should be defined", () => {
    expect(directorController).toBeDefined();
  });

  /**
   * 감독 생성
   */

  const director = {
    name: "jjalseu",
  };

  describe("create", () => {
    it("should create user", async () => {
      const createDirectorDto = {
        name: "jjalseu",
      };

      jest
        .spyOn(directorService, "create")
        .mockResolvedValue(director as Director);

      const result = await directorController.create(
        createDirectorDto as CreateDirectorDto,
      );

      expect(directorService.create).toHaveBeenCalledWith(
        createDirectorDto,
      );
      expect(result).toEqual(director);
    });
  });

  /**
   * 감독 목록 조회
   */

  describe("findAll", () => {
    it("should return director list", async () => {
      jest
        .spyOn(directorService, "findAll")
        .mockResolvedValue([director] as Director[]);

      const result = await directorController.findAll();

      expect(directorService.findAll).toHaveBeenCalled();

      expect(result).toEqual([director]);
    });
  });

  /**
   * 감독 상세 조회
   */

  describe("findOne", () => {
    it("should call findOne method from DirectorService with correct ID", () => {
      const result = { id: 1, name: "codefactory" };

      jest
        .spyOn(mockDirectorService, "findOne")
        .mockResolvedValue(result);

      expect(
        directorController.findOne(1),
      ).resolves.toEqual(result);
      expect(directorService.findOne).toHaveBeenCalledWith(
        1,
      );
    });
  });
  /**
   * 감독 수정
   */

  describe("update", async () => {
    it("should call update method from DirectorService with correct ID and DTO", async () => {
      const updateDirectorDto = { name: "Code Factory" };
      const result = {
        id: 1,
        name: "Code Factory",
      };
      jest
        .spyOn(mockDirectorService, "update")
        .mockResolvedValue(result);

      await expect(
        directorController.update(1, updateDirectorDto),
      ).resolves.toEqual(result);
      expect(directorService.update).toHaveBeenCalledWith(
        1,
        updateDirectorDto,
      );
    });
  });
  /**
   * 감독 제거
   */

  describe("remove", async () => {
    it("should call remove method from DirectorService with correct ID", async () => {
      const result = 1;
      jest
        .spyOn(mockDirectorService, "remove")
        .mockResolvedValue(result);

      await expect(
        directorController.remove(1),
      ).resolves.toEqual(result);
      expect(directorService.remove).toHaveBeenCalledWith(
        1,
      );
    });
  });
});
