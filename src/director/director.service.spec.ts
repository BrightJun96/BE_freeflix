import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { afterEach, describe } from "node:test";
import { Repository } from "typeorm";
import { DirectorService } from "./director.service";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { Director } from "./entities/director.entity";

const mockDirectorService = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe("DirectorService", () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          DirectorService,
          {
            provide: getRepositoryToken(Director),
            useValue: mockDirectorService,
          },
        ],
      }).compile();

    directorService =
      module.get<DirectorService>(DirectorService);

    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(directorService).toBeDefined();
  });

  /**
   * 감독 생성
   */
  describe("create", () => {
    it("should create a director", async () => {
      const director = {
        id: 1,
        name: "christopher",
      };

      const directorDto: CreateDirectorDto = {
        name: "christopher",
        dob: new Date("1996-11-15"),
        nationality: "korean",
      };

      jest
        .spyOn(directorRepository, "save")
        .mockResolvedValue(director as Director);

      const result =
        await directorService.create(directorDto);

      expect(directorRepository.save).toHaveBeenCalledWith(
        directorDto,
      );

      expect(result).toEqual(director);
    });
  });

  /**
   * 감독 목록 조회
   */
  describe("findAll", () => {
    it("should return director List", async () => {
      const directors = [
        { name: "christopher" },
        { name: "bong jun ho" },
      ];

      jest
        .spyOn(directorRepository, "find")
        .mockResolvedValue(directors as Director[]);

      const result = await directorService.findAll();

      expect(directorRepository.find).toHaveBeenCalled();

      expect(result).toEqual(directors);
    });
  });

  /**
   * 감독 상세 조회
   */
  describe("findOne", () => {
    it("should return a director", async () => {
      const director = {
        name: "christopher",
      };

      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValue(director as Director);

      const result = await directorService.findOne(1);

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual(director);
    });

    it("should throw an error if director is not found", async () => {
      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValue(null);

      // const result = await directorService.findOne(2);

      await expect(
        directorService.findOne(2),
      ).rejects.toThrow(NotFoundException);

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
    });
  });

  /**
   * 감독 수정
   */
  describe("update", () => {
    const updateDirectorDto = {
      name: "jjalseu",
    };

    const userId = 1;

    it("should update director", async () => {
      const existDirector = {
        name: "jjalseu",
      };

      const directorAfterUpdate = {
        name: "junho",
      };

      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValueOnce(existDirector as Director); // 수정 전 객체
      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValueOnce(
          directorAfterUpdate as Director,
        ); // 수정 후 객체

      const result = await directorService.update(
        userId,
        updateDirectorDto,
      );

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });

      expect(
        directorRepository.update,
      ).toHaveBeenCalledWith(userId, updateDirectorDto);

      expect(result).toEqual(directorAfterUpdate);
    });

    it("should throw an Error if director is not found", async () => {
      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        directorService.update(userId, updateDirectorDto),
      ).rejects.toThrow(NotFoundException);

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
    });
  });

  /**
   * 감독 삭제
   */

  describe("remove", () => {
    const directorId = 1;
    const director = {
      name: "jjalseu",
    };

    it("should delete director", async () => {
      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValue(director as Director);

      const result =
        await directorService.remove(directorId);

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith(directorId);

      expect(result).toEqual(director);
    });

    it("should throw an Error if director is not found", async () => {
      jest
        .spyOn(directorRepository, "findOne")
        .mockResolvedValue(null);

      await expect(
        directorService.remove(directorId),
      ).rejects.toThrow(NotFoundException);

      expect(
        directorRepository.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: directorId,
        },
      });
    });
  });
});
