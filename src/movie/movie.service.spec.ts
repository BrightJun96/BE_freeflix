import { TestBed } from "@automock/jest";
import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";

import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  DataSource,
  In,
  QueryRunner,
  Repository,
} from "typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { CACHE_KEY } from "../shared/const/cache-key.const";
import { SharedService } from "../shared/shared.service";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieDetail } from "./entities/movie-detail.entity";
import { MovieUserLike } from "./entities/movie-user.like";
import { Movie } from "./entities/movie.entity";
import { MovieService } from "./movie.service";

describe("MovieService", () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let movieDetailRepository: jest.Mocked<
    Repository<MovieDetail>
  >;
  let directorRepository: jest.Mocked<Repository<Director>>;
  let genreRepository: jest.Mocked<Repository<Genre>>;
  let movieUserLikeRepository: jest.Mocked<
    Repository<MovieUserLike>
  >;
  let datasource: jest.Mocked<DataSource>;
  let shardService: jest.Mocked<SharedService>;
  let userService: jest.Mocked<UserService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    // const module: TestingModule = await Test.createTestingModule({
    //   providers: [MovieService],
    // }).compile();

    const { unit, unitRef } =
      TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepository = unitRef.get(
      getRepositoryToken(Movie) as string,
    );

    movieDetailRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );

    directorRepository = unitRef.get(
      getRepositoryToken(Director) as string,
    );

    genreRepository = unitRef.get(
      getRepositoryToken(Genre) as string,
    );

    movieUserLikeRepository = unitRef.get(
      getRepositoryToken(MovieUserLike) as string,
    );

    datasource = unitRef.get(DataSource);
    shardService = unitRef.get(SharedService);
    userService = unitRef.get(UserService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  it("should be defined", () => {
    expect(movieService).toBeDefined();
  });

  /**
   * 최신 영화 목록
   */
  describe("findLatestMovies", () => {
    it("should return latestMovies", async () => {
      const cachedMovies = [
        {
          id: 1,
          title: "파이 베리",
        },
      ];
      jest
        .spyOn(cacheManager, "get")
        .mockResolvedValue(cachedMovies);

      // jest
      //   .spyOn(movieRepository, "find")
      //   .mockResolvedValue();

      const result = await movieService.findLatestMovies();

      expect(cacheManager.get).toHaveBeenCalledWith(
        CACHE_KEY.RECENT_MOVIES,
      );

      expect(result).toEqual(cachedMovies);
    });

    it("should fetch latest Movies from repository and cache them if not found in cache", async () => {
      const recentMovies = [
        {
          id: 1,
          title: "파이 베리",
        },
      ];

      jest
        .spyOn(cacheManager, "get")
        .mockResolvedValue(null);

      jest
        .spyOn(movieRepository, "find")
        .mockResolvedValue(recentMovies as Movie[]);

      const result = await movieService.findLatestMovies();

      expect(cacheManager.get).toHaveBeenCalledWith(
        CACHE_KEY.RECENT_MOVIES,
      );

      expect(movieRepository.find).toHaveBeenCalled();

      expect(cacheManager.set).toHaveBeenCalledWith(
        CACHE_KEY.RECENT_MOVIES,
        recentMovies,
      );

      expect(result).toEqual(result);
    });
  });

  /**
   * 영화 목록
   */
  describe("findAll", () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMoviesMock: jest.SpyInstance;
    const nextCursor = "sdfsdfsdf";

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, "getMovies");
      getLikedMoviesMock = jest.spyOn(
        movieService,
        "getLikedMovies",
      );
    });

    it("should return movieList without user likes", async () => {
      const movies = [
        {
          id: 1,
          title: "movie1",
        },
      ];

      const dto = {
        title: "movie",
      } as GetMovieDto;

      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockResolvedValue(qb);

      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockResolvedValue({
          nextCursor,
          qb,
        });

      const result = await movieService.findAll(dto);

      expect(qb.where).toHaveBeenCalledWith(
        "movie.title ILIKE :title",
        {
          title: `%movie%`,
        },
      );

      expect(
        shardService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);

      expect(qb.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: movies,
        count: 1,
        nextCursor,
      });
    });

    it("should return a list of movies with user likes", async () => {
      const movies = [
        {
          id: 1,
          title: "Movie 1",
        },
        {
          id: 3,
          title: "Movie 3",
        },
      ];
      const likedMovies = [
        {
          movie: { id: 1 },
          isLike: true,
        },
        {
          movie: { id: 2 },
          isLike: false,
        },
      ];
      const dto = { title: "Movie" } as GetMovieDto;
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockResolvedValue(qb);

      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockReturnValue({ nextCursor: null } as any);

      getLikedMoviesMock.mockResolvedValue(likedMovies);

      const userId = 1;
      const result = await movieService.findAll(
        dto,
        userId,
      );

      expect(getMoviesMock).toHaveBeenCalled();

      expect(qb.where).toHaveBeenCalledWith(
        "movie.title ILIKE :title",
        {
          title: "%Movie%",
        },
      );

      expect(
        shardService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);

      expect(qb.getManyAndCount).toHaveBeenCalled();

      expect(getLikedMoviesMock).toHaveBeenCalledWith(
        movies.map((movie) => movie.id),
        userId,
      );

      expect(result).toEqual({
        data: [
          {
            id: 1,
            title: "Movie 1",
            likeStatus: true,
          },
          {
            id: 3,
            title: "Movie 3",
            likeStatus: null,
          },
        ],
        nextCursor: null,
        count: 1,
      });
    });
    it("should return movies without title filter", async () => {
      const movies = [{ id: 1, title: "Movie 1" }];
      const dto = {} as GetMovieDto;
      const qb: any = {
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockResolvedValue({
          nextCursor,
          qb,
        });

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.getManyAndCount).toHaveBeenCalledWith();
      expect(result).toEqual({
        data: movies,
        nextCursor,
        count: 1,
      });
    });

    it("should return movies with cursor", async () => {
      const dto = {
        cursor:
          "eyJ2YWx1ZXMiOnsiaWQiOjR9LCJvcmRlcnMiOlsiaWRfREVTQyJdfQ==",
      } as GetMovieDto;

      const movies = [{ id: 1, title: "movie1" }];

      const query = '(movie."id") < (:id)';
      const values = {
        id: 4,
      };

      const qb: any = {
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        alias: "movie",
      };

      getMoviesMock.mockResolvedValue(qb);

      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockResolvedValue({
          nextCursor,
          qb,
        });

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith(query, values);

      expect(
        shardService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);

      expect(qb.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: movies,
        count: 1,
        nextCursor,
      });
    });

    it("should return movies with order", async () => {
      const dto = {
        order: ["likeCount_DESC", "id_DESC"],
      } as GetMovieDto;

      const movies = [{ id: 1, title: "movie1" }];

      const qb: any = {
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        alias: "movie",
      };

      getMoviesMock.mockResolvedValue(qb);

      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockResolvedValue({
          nextCursor,
          qb,
        });

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();

      expect(
        shardService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);

      expect(qb.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: movies,
        count: 1,
        nextCursor,
      });
    });

    it("should throw an error if direction !== ASC && !==DESC", async () => {
      const dto = {
        order: ["likeCount_DES"],
      } as GetMovieDto;

      const movies = [{ id: 1, title: "movie1" }];

      const qb: any = {
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([movies, 1]),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        alias: "movie",
      };

      getMoviesMock.mockResolvedValue(qb);

      jest
        .spyOn(
          shardService,
          "applyCursorPaginationParamsToQb",
        )
        .mockResolvedValue({
          nextCursor,
          qb,
        });

      await expect(
        movieService.findAll(dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * 영화 상세
   */
  describe("findOne", () => {
    let getMovieMock: jest.SpyInstance;

    beforeEach(() => {
      getMovieMock = jest.spyOn(
        movieService,
        "getMovieDetail",
      );
    });
    it("should return a movie", async () => {
      const movieId = 1;

      const movie = {
        title: "movie1",
      };

      getMovieMock.mockResolvedValue(movie);

      const result = await movieService.findOne(movieId);

      expect(getMovieMock).toHaveBeenCalledWith(1);

      expect(result).toEqual(movie);
    });

    it("should throw an error if movie is not found", async () => {
      const movieId = 1;

      getMovieMock.mockResolvedValue(null);

      await expect(
        movieService.findOne(movieId),
      ).rejects.toThrow(NotFoundException);

      expect(getMovieMock).toHaveBeenCalledWith(1);
    });
  });

  /**
   * 영화 생성
   */

  describe("create", () => {
    let createMovieDto: CreateMovieDto = {
      title: "movie1",
      genreIds: [1, 2],
      detail: "movie1 details",
      directorId: 1,
      movieFilePath: "filepath",
    };

    const movie = {
      ...createMovieDto,
      id: 1,
    };

    const genres = [
      {
        id: 1,
        name: "fantasy",
      },
      {
        id: 2,
        name: "romantic",
      },
    ];

    const director = {
      id: 1,
      name: "jjalseu",
      dob: new Date("1996-11-15"),
    };

    const userId = 1;

    let qr: jest.Mocked<QueryRunner>;

    let createMovieDetailMock: jest.SpyInstance;
    let createMovieMock: jest.SpyInstance;
    let createMovieGenreRelationMock: jest.SpyInstance;
    let renameMovieFileMock: jest.SpyInstance;
    const movieDetailInsertResult = {
      identifiers: [{ id: 1 }],
    };

    const movieInsertResult = {
      identifiers: [{ id: 1 }],
    };

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      createMovieDetailMock = jest.spyOn(
        movieService,
        "createMovieDetail",
      );

      createMovieMock = jest.spyOn(
        movieService,
        "createMovie",
      );

      createMovieGenreRelationMock = jest.spyOn(
        movieService,
        "createMovieGenreRelation",
      );
      renameMovieFileMock = jest.spyOn(
        movieService,
        "renameMovieFile",
      );

      (qr.manager.find as jest.Mock).mockResolvedValue(
        genres,
      );

      createMovieDetailMock.mockResolvedValue(
        movieDetailInsertResult,
      );
      createMovieMock.mockResolvedValue(movieInsertResult);

      createMovieGenreRelationMock.mockResolvedValue(
        undefined,
      );

      renameMovieFileMock.mockResolvedValue(undefined);
    });

    /**
     * 영화 생성 정상 작동 테스트
     */
    it("should create a movie", async () => {
      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(director);

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(null);

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(movie);

      const result = await movieService.create(
        createMovieDto as CreateMovieDto,
        userId,
        qr,
      );

      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });

      expect(qr.manager.findOne).toHaveBeenNthCalledWith(
        1,
        Director,
        {
          where: {
            id: createMovieDto.directorId,
          },
        },
      );

      expect(createMovieDetailMock).toHaveBeenCalledWith(
        qr,
        createMovieDto,
      );

      expect(qr.manager.findOne).toHaveBeenNthCalledWith(
        2,
        Movie,
        {
          where: {
            title: createMovieDto.title,
          },
        },
      );

      expect(createMovieMock).toHaveBeenCalledWith(
        qr,
        createMovieDto,
        movieDetailInsertResult.identifiers[0].id,
        expect.any(String),
        director,
        userId,
      );

      expect(
        createMovieGenreRelationMock,
      ).toHaveBeenCalledWith(
        qr,
        movieInsertResult.identifiers[0].id,
        genres,
      );

      expect(renameMovieFileMock).toHaveBeenCalledWith(
        createMovieDto,
      );

      expect(result).toEqual(movie);
    });

    /**
     * 영화 생성시 존재하지 않는 장르로 생성할시,
     */
    it("should throw an error when a non-existent genre is used to create a movie", async () => {
      createMovieDto = {
        ...createMovieDto,
        genreIds: [...createMovieDto.genreIds, 3],
      };

      await expect(
        movieService.create(createMovieDto, userId, qr),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * 영화 생성시 존재하지 감독으로 생성시
     */
    it("should throw an error when a non-existent director is used to create a movie", async () => {
      createMovieDto = {
        ...createMovieDto,
        genreIds: [1, 2],
      };

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(null);

      await expect(
        movieService.create(createMovieDto, userId, qr),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * 영화 생성시 이미 존재하는 영화로 생성시
     */
    it("should throw an error when a existent movie is used to create a movie", async () => {
      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(director);

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(movie);

      await expect(
        movieService.create(createMovieDto, userId, qr),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * 영화 수정
   */
  describe("update", () => {
    const movieId = 1;
    // 수정 이전 영화
    const movieBeforeUpdate = {
      id: 1,
      title: "타노스 일대기",
      director: {
        id: 1,
        name: "jjalseu",
      },
      genres: [
        {
          id: 1,
        },
      ],
      detail: {
        id: 1,
      },
    };

    // 수정 이후 영화
    const movieAfterUpdate = {
      id: 1,
      title: "어벤져스",
      director: {
        id: 2,
        name: "john",
      },
      genres: [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ],
      detail: {
        id: 2,
      },
    };

    const updateMovieDto: UpdateMovieDto = {
      title: "어벤져스",
      directorId: 2,
      genreIds: [1, 2],
      detail: "타노스 죽음",
    };

    const updatedDirector = {
      id: 2,
    };

    const updatedGenres = [{ id: 1 }, { id: 2 }];

    let qr: jest.Mocked<QueryRunner>;

    let updateMovieMock: jest.SpyInstance;
    let findDirectorMock: jest.SpyInstance;
    let findGenresMock: jest.SpyInstance;
    let updateMovieDetailMock: jest.SpyInstance;
    let updateMovieGenreRelationMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      updateMovieMock = jest.spyOn(
        movieService,
        "updateMovie",
      );

      findDirectorMock = jest.spyOn(
        movieService,
        "findDirector",
      );

      findGenresMock = jest.spyOn(
        movieService,
        "findGenres",
      );

      updateMovieGenreRelationMock = jest.spyOn(
        movieService,
        "updateMovieGenreRelation",
      );

      updateMovieDetailMock = jest.spyOn(
        movieService,
        "updateMovieDetail",
      );

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(movieBeforeUpdate);

      (
        qr.manager.findOne as jest.Mock
      ).mockResolvedValueOnce(movieAfterUpdate);

      updateMovieMock.mockResolvedValue(undefined);

      findDirectorMock.mockResolvedValue(updatedDirector);

      findGenresMock.mockResolvedValue(updatedGenres);

      updateMovieGenreRelationMock.mockResolvedValue(
        undefined,
      );

      updateMovieDetailMock.mockResolvedValue(undefined);
    });

    /**
     * 영화 수정 정상 작동 테스트
     */

    it("should update a movie", async () => {
      const result = await movieService.update(
        movieId,
        updateMovieDto,
        qr,
      );

      expect(result.title).not.toEqual(
        movieBeforeUpdate.title,
      );

      expect(result.director.id).not.toEqual(
        movieBeforeUpdate.director.id,
      );

      const sumResultGenreIdResult = result.genres.reduce(
        (acc, cur) => acc + cur.id,
        0,
      );

      const sumBeforeMovieGenreIdResult =
        movieBeforeUpdate.genres.reduce(
          (acc, cur) => acc + cur.id,
          0,
        );

      expect(sumResultGenreIdResult).not.toEqual(
        sumBeforeMovieGenreIdResult,
      );

      expect(result.detail.id).not.toEqual(
        movieBeforeUpdate.detail.id,
      );
    });
  });

  /**
   * 영화 삭제
   */
  describe("remove", () => {
    const movieId = 1;

    const movie = {
      id: 1,
      title: "movie",
      detail: {
        id: 1,
      },
    };

    let qr: jest.Mocked<QueryRunner>;
    let removeMovieMock: jest.SpyInstance;
    let removeMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;

      removeMovieMock = jest.spyOn(
        movieService,
        "removeMovie",
      );

      removeMovieDetailMock = jest.spyOn(
        movieService,
        "removeMovieDetail",
      );

      removeMovieMock.mockResolvedValue(undefined);

      removeMovieDetailMock.mockResolvedValue(undefined);
    });

    it("should remove a movie", async () => {
      (qr.manager.findOne as jest.Mock).mockResolvedValue(
        movie,
      );
      const result = await movieService.remove(movieId, qr);

      expect(result).toEqual(movie);
    });

    it("should throw an error if movie is not found", async () => {
      (qr.manager.findOne as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(
        movieService.remove(movieId, qr),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 장르 찾기
   */
  describe("findGenres", () => {
    const qr = {
      manager: {
        find: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    const genreIds = [1, 2];
    const genres = [
      {
        id: 1,
      },
      {
        id: 2,
      },
    ];

    beforeEach(() => {
      (qr.manager.find as jest.Mock).mockResolvedValueOnce(
        genres,
      );
    });

    it("should return genres", async () => {
      const result = await movieService.findGenres(
        genreIds,
        qr,
      );

      expect(result).toEqual(genres);
    });

    it("should throw an error if genreIds are not match find genre's id", async () => {
      genreIds.push(3);

      await expect(
        movieService.findGenres(genreIds, qr),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 감독 찾기
   */
  describe("findDirector", () => {
    const qr = {
      manager: {
        findOne: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    const director = {
      id: 1,
    };

    const directorId = 1;

    it("should return director", async () => {
      (qr.manager.findOne as jest.Mock).mockResolvedValue(
        director,
      );

      const result = await movieService.findDirector(
        directorId,
        qr,
      );

      expect(result).toEqual(director);
    });

    it("should throw an error if director is not found", async () => {
      (qr.manager.findOne as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        movieService.findDirector(directorId, qr),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * 좋아요,싫어요 주요 로직 메서드
   */
  describe("likeHandler", () => {
    const movie = {
      id: 1,
      title: "어벤져스",
    };

    const movieId = 1;

    const user = {
      id: 1,
      email: "test@test.com",
    };

    const userId = 1;
    const mulBeforeUpdate = {
      isLike: true,
      movieId: 1,
      userId: 1,
    };

    let mulAfterUpdate = {
      isLike: true,
      movieId: 1,
      userId: 1,
    };

    let getMovieUserLikeRelationMock: jest.SpyInstance;
    let saveMul: jest.SpyInstance;
    let deleteMul: jest.SpyInstance;
    let updateMul: jest.SpyInstance;
    beforeEach(() => {
      jest
        .spyOn(movieService, "findOne")
        .mockResolvedValue(movie as Movie);

      jest
        .spyOn(userService, "findOne")
        .mockResolvedValue(user as User);

      getMovieUserLikeRelationMock = jest.spyOn(
        movieService,
        "getMovieUserLikeRelation",
      );

      saveMul = jest.spyOn(movieUserLikeRepository, "save");
      deleteMul = jest.spyOn(
        movieUserLikeRepository,
        "delete",
      );
      updateMul = jest.spyOn(
        movieUserLikeRepository,
        "update",
      );
    });

    it("should update movie's like If the user has not liked the movie when user press movie's like button", async () => {
      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        null,
      );

      saveMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );

      expect(result.isLike).toEqual(mulAfterUpdate.isLike);
    });

    it("should update movie's like If the user has liked the movie when user press movie's like button", async () => {
      mulAfterUpdate = null;

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulBeforeUpdate,
      );

      deleteMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );

      expect(result.isLike).toEqual(false);
    });

    it("should update movie's like If the user has disliked the movie when user press movie's like button", async () => {
      mulBeforeUpdate.isLike = false;

      mulAfterUpdate = {
        userId: 1,
        movieId: 1,
        isLike: true,
      };

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulBeforeUpdate,
      );

      updateMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );

      expect(result.isLike).toEqual(true);
    });

    it("should update movie's dislike If the user has not disliked the movie when user press movie's dislike button", async () => {
      mulBeforeUpdate.isLike = false;
      mulAfterUpdate.isLike = false;
      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        null,
      );

      saveMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );

      expect(result.isDislike).toEqual(true);
    });

    it("should update movie's dislike If the user has disliked the movie when user press movie's dislike button", async () => {
      mulAfterUpdate = null;

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulBeforeUpdate,
      );

      deleteMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );

      expect(result.isDislike).toEqual(false);
    });

    it("should update movie's dislike If the user has liked the movie when user press movie's dislike button", async () => {
      mulBeforeUpdate.isLike = true;

      mulAfterUpdate = {
        userId: 1,
        movieId: 1,
        isLike: false,
      };

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulBeforeUpdate,
      );

      updateMul.mockResolvedValue(undefined);

      getMovieUserLikeRelationMock.mockResolvedValueOnce(
        mulAfterUpdate,
      );

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );

      expect(result.isDislike).toEqual(true);
    });
  });
});
