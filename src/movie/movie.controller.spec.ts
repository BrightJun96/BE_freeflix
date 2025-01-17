import { TestBed } from "@automock/jest";
import { QueryRunner } from "typeorm";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { Movie } from "./entities/movie.entity";
import { MovieController } from "./movie.controller";
import { MovieService } from "./movie.service";

describe("MovieController", () => {
  let movieController: MovieController;
  let movieService: MovieService;

  beforeEach(() => {
    const { unit, unitRef } =
      TestBed.create(MovieController).compile();

    movieController = unit;

    movieService = unitRef.get(MovieService);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(movieController).toBeDefined();
  });

  const userId = 1;
  const movies = [
    { id: 1, title: "파이" },
    { id: 2, title: "베리" },
  ];

  describe("영화 목록 [GET /movie]", () => {
    const getMovieDto: GetMovieDto = {
      title: "파이",
      take: 5,
      order: ["id_DESC"],
    };
    it("영화 목록을 반환해야합니다. movieService.findAll 메서드 호출해야합니다.", async () => {
      const response = {
        count: 10,
        nextCursor: "Sdfsdf",
        data: movies as Movie[],
      };
      jest
        .spyOn(movieService, "findAll")
        .mockResolvedValue(response);

      const result = await movieController.getMovies(
        getMovieDto,
        userId,
      );

      expect(result).toEqual(response);
    });
  });

  describe("최근 영화 목록 [GET /movie/recent]", () => {
    it("최근 영화 목록을 반환해야합니다. movieService.findLatestMovies 메서드 호출", async () => {
      jest
        .spyOn(movieService, "findLatestMovies")
        .mockResolvedValue(movies);
      const result =
        await movieController.getRecentMovies();

      expect(result).toEqual(movies);
    });
  });

  describe("영화 상세 조회 [GET /movie/:id]", () => {
    const movieId = 1;
    it("영화 상세 데이터를 반환해야합니다. movieService.findOne 메서드 호출", async () => {
      jest
        .spyOn(movieService, "findOne")
        .mockResolvedValue(movies[0] as Movie);

      const result =
        await movieController.getMovie(movieId);

      expect(result).toEqual(movies[0]);
    });
  });

  describe("영화 생성 [POST /movie]", () => {
    const createMovieDto = {
      title: "얄렵송",
    };
    const qr = {};

    it("영화를 생성해야합니다. movieService.create 호출", async () => {
      jest
        .spyOn(movieService, "create")
        .mockResolvedValue(movies[0] as Movie);

      const result = await movieController.postMovie(
        createMovieDto as CreateMovieDto,
        qr as QueryRunner,
        userId,
      );
      expect(result).toEqual(movies[0]);
    });
  });

  describe("영화 수정 [PATCH /movie/:id]", () => {
    const updateMovieDto = {
      title: "얄렵송",
    };
    const qr = {};

    it("영화를 수정해야합니다. movieService.update 호출", async () => {
      jest
        .spyOn(movieService, "update")
        .mockResolvedValue(movies[0] as Movie);

      const result = await movieController.patchMovie(
        1,
        updateMovieDto as UpdateMovieDto,
        qr as QueryRunner,
      );
      expect(result).toEqual(movies[0]);
    });
  });

  describe("영화 삭제 [DELETE /movie/:id]", () => {
    const qr = {};

    it("영화를 삭제해야합니다. movieService.remove 호출", async () => {
      jest
        .spyOn(movieService, "remove")
        .mockResolvedValue(movies[0] as Movie);

      const result = await movieController.deleteMovie(
        1,
        qr as QueryRunner,
      );
      expect(result).toEqual(movies[0]);
    });
  });

  describe("좋아요 [POST /movie/:id/like]", () => {
    it("좋아요 데이터 상태를 변경합니다. movieService.likeMovie 호출", async () => {
      const response = {
        isLike: true,
      };
      jest
        .spyOn(movieService, "likeMovie")
        .mockResolvedValue(response);

      const result = await movieController.likeMovie(
        1,
        userId,
      );

      expect(result).toEqual(response);
    });
  });

  describe("싫어요 [POST /movie/:id/dislike]", () => {
    it("싫어요 데이터 상태를 변경합니다. movieService.dislikeMovie 호출", async () => {
      const response = {
        isDislike: true,
      };
      jest
        .spyOn(movieService, "dislikeMovie")
        .mockResolvedValue(response);

      const result = await movieController.dislikeMovie(
        1,
        userId,
      );

      expect(result).toEqual(response);
    });
  });
});
