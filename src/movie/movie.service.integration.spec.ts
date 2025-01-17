import {
  Cache,
  CACHE_MANAGER,
  CacheModule,
} from "@nestjs/cache-manager";
import { NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { CACHE_KEY } from "../shared/const/cache-key.const";
import { SharedService } from "../shared/shared.service";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieDetail } from "./entities/movie-detail.entity";
import { MovieUserLike } from "./entities/movie-user.like";
import { Movie } from "./entities/movie.entity";
import { MovieService } from "./movie.service";

describe("MovieService Integration Test", () => {
  let movieService: MovieService;
  let dataSource: DataSource;
  let cacheManager: Cache;

  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];

  beforeAll(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        imports: [
          CacheModule.register(),
          TypeOrmModule.forRoot({
            type: "sqlite",
            database: ":memory:",
            dropSchema: true,
            entities: [
              Movie,
              MovieDetail,
              MovieUserLike,
              Director,
              Genre,
              User,
            ],
            synchronize: true,
            logging: false,
          }),

          TypeOrmModule.forFeature([
            Movie,
            MovieDetail,
            MovieUserLike,
            Director,
            Genre,
            User,
          ]),
          // UserModule,
          // SharedModule,
          // ConfigModule.forRoot(),
        ],
        providers: [
          MovieService,
          SharedService,
          UserService,
          ConfigService,
        ],
      }).compile();

    movieService = module.get<MovieService>(MovieService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    dataSource = module.get<DataSource>(DataSource);
  });

  it("should be defined", () => {
    expect(movieService).toBeDefined();
  });

  beforeEach(async () => {
    await cacheManager.reset();

    const movieRepository = dataSource.getRepository(Movie);
    const movieDetailRepository =
      dataSource.getRepository(MovieDetail);
    const userRepository = dataSource.getRepository(User);
    const directorRepository =
      dataSource.getRepository(Director);
    const genreRepository = dataSource.getRepository(Genre);

    users = [1, 2].map((x) =>
      userRepository.create({
        id: x,
        email: `${x}@test.com`,
        password: `123123`,
      }),
    );

    await userRepository.save(users);

    directors = [1, 2].map((x) =>
      directorRepository.create({
        id: x,
        dob: new Date("1992-11-23"),
        nationality: "South Korea",
        name: `Director Name ${x}`,
      }),
    );

    await directorRepository.save(directors);

    genres = [1, 2].map((x) =>
      genreRepository.create({
        id: x,
        name: `Genre ${x}`,
      }),
    );

    await genreRepository.save(genres);

    movies = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ].map((x) =>
      movieRepository.create({
        id: x,
        title: `Movie ${x}`,
        creator: users[0],
        genres: genres,
        likeCount: 0,
        dislikeCount: 0,
        detail: movieDetailRepository.create({
          detail: `Movie Detail ${x}`,
        }),
        movieFilePath: "movies/movie1.mp4",
        director: directors[0],
        createdAt: new Date(`2023-9-${x}`),
      }),
    );

    await movieRepository.save(movies);
  });

  describe("findLatestMovies", () => {
    it("should return recent movies", async () => {
      const result =
        (await movieService.findLatestMovies()) as Movie[];

      const sortedResult = [...movies];
      sortedResult.sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const sortedResultIds = sortedResult
        .slice(0, 10)
        .map((x) => x.id);

      expect(result).toHaveLength(10);
      expect(result.map((x) => x.id)).toEqual(
        sortedResultIds,
      );
    });

    it("should cache recent movies", async () => {
      const result =
        (await movieService.findLatestMovies()) as Movie[];

      const cachedData = await cacheManager.get(
        CACHE_KEY.RECENT_MOVIES,
      );

      expect(cachedData).toEqual(result);
    });
  });

  describe("findAll", () => {
    it("should return movies with correct titles", async () => {
      const dto = {
        title: "Movie 15",
        order: ["createdAt_DESC"],
        take: 10,
      };

      const result = await movieService.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe(dto.title);
      expect(result.data[0]).not.toHaveProperty(
        "likeStatus",
      );
    });

    it("should return likeStatus if userId is provided", async () => {
      const dto = { order: ["createdAt_ASC"], take: 10 };

      const result = await movieService.findAll(
        dto,
        users[0].id,
      );

      expect(result.data).toHaveLength(10);
      expect(result.data[0]).toHaveProperty("likeStatus");
    });
  });

  describe("findOne", () => {
    it("should return movie correctly", async () => {
      const movieId = movies[0].id;

      const result = await movieService.findOne(movieId);

      expect(result.id).toBe(movieId);
    });

    it("should throw NotFoundException if movie does not exist", async () => {
      await expect(
        movieService.findOne(999999999999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    beforeEach(() => {
      jest
        .spyOn(movieService, "renameMovieFile")
        .mockResolvedValue();
    });

    it("should create movie correctly", async () => {
      const createMovieDto: CreateMovieDto = {
        title: "Test Movie",
        detail: "A Test Movie Detail",
        directorId: directors[0].id,
        genreIds: genres.map((x) => x.id),
        movieFilePath: "test.mp4",
      };

      const result = await movieService.create(
        createMovieDto,
        users[0].id,
        dataSource.createQueryRunner(),
      );

      expect(result.title).toBe(createMovieDto.title);
      expect(result.director.id).toBe(
        createMovieDto.directorId,
      );
      expect(result.genres.map((g) => g.id)).toEqual(
        genres.map((g) => g.id),
      );
      expect(result.detail.detail).toBe(
        createMovieDto.detail,
      );
    });
  });

  describe("update", () => {
    it("should update movie correctly", async () => {
      const movieId = movies[0].id;

      const updateMovieDto: UpdateMovieDto = {
        title: "Changed Title",
        detail: "Changed Detail",
        directorId: directors[1].id,
        genreIds: [genres[0].id],
      };

      const result = await movieService.update(
        movieId,
        updateMovieDto,
        dataSource.createQueryRunner(),
      );

      expect(result.title).toBe(updateMovieDto.title);
      expect(result.detail.detail).toBe(
        updateMovieDto.detail,
      );
      expect(result.director.id).toBe(
        updateMovieDto.directorId,
      );
      expect(result.genres.map((x) => x.id)).toEqual(
        updateMovieDto.genreIds,
      );
    });

    it("should throw error if movie does not exist", async () => {
      const updateMovieDto: UpdateMovieDto = {
        title: "Change",
      };

      await expect(
        movieService.update(
          9999999,
          updateMovieDto,
          dataSource.createQueryRunner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove movie correctly", async () => {
      const removeId = movies[0].id;
      const result = await movieService.remove(
        removeId,
        dataSource.createQueryRunner(),
      );

      expect(result.id).toBe(removeId);
    });

    it("should throw error if movie does not exist", async () => {
      await expect(
        movieService.remove(
          999999,
          dataSource.createQueryRunner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("toggleMovieLike", () => {
    it("should create like correctly", async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );

      expect(result).toEqual({ isLike: true });
    });

    it("should create dislike correctly", async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      const result = await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );

      expect(result).toEqual({ isDislike: true });
    });

    it("should toggle like correctly", async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );
      const result = await movieService.likeHandler(
        movieId,
        userId,
        "LIKE",
      );

      expect(result.isLike).toBe(false);
    });

    it("should toggle dislike correctly", async () => {
      const userId = users[0].id;
      const movieId = movies[0].id;

      await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );
      const result = await movieService.likeHandler(
        movieId,
        userId,
        "DISLIKE",
      );

      expect(result.isDislike).toBe(false);
    });
  });
});
