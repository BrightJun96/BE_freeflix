import { TestBed } from "@automock/jest";
import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { CACHE_KEY } from "../shared/const/cache-key.const";
import { SharedService } from "../shared/shared.service";
import { UserService } from "../user/user.service";
import { GetMovieDto } from "./dto/get-movie.dto";
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

  describe("findAll", () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMoviesMock: jest.SpyInstance;
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

      const nextCursor = "sdfsdfsdf";

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
          nextCursor: null,
        } as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.getManyAndCount).toHaveBeenCalledWith();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });
  });
});
