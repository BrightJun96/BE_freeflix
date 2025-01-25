import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { rename } from "node:fs/promises";

import { join } from "path";
import {
  DataSource,
  In,
  QueryRunner,
  Repository,
} from "typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { CACHE_KEY } from "../shared/const/cache-key.const";
import { envVariablesKeys } from "../shared/const/env.const";
import { Relations } from "../shared/const/relation.const";
import { SharedService } from "../shared/shared.service";
import { UserService } from "../user/user.service";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieDetail } from "./entities/movie-detail.entity";
import { MovieUserLike } from "./entities/movie-user-like.entity";
import { Movie } from "./entities/movie.entity";

export interface LikeStatusReturnType {
  isLike?: boolean;
  isDislike?: boolean;
}
@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly sharedService: SharedService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  // 단순 영화 조회 => 테스트 커버리지 제외 => 단순 레포지터리 조회기 때문에 테스트하지 않아도됨.

  // 최신 영화 목록
  async findLatestMovies() {
    const recentMovies = await this.cacheManager.get(
      CACHE_KEY.RECENT_MOVIES,
    );

    if (recentMovies) {
      return recentMovies; // JSON.parse(recentMovies);
    }

    const movies = await this.movieRepository.find({
      order: {
        createdAt: "DESC",
      },
      take: 10,
    });

    await this.cacheManager.set(
      CACHE_KEY.RECENT_MOVIES,
      movies, // JSON.stringify(movies),
    );

    return movies;
  }

  // 좋아요한 영화 조회 => 테스트 커버리지 제외

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder("movie")
      .leftJoinAndSelect("movie.detail", "detail")
      .leftJoinAndSelect("movie.director", "director")
      .leftJoinAndSelect("movie.genres", "genres");
  }
  // 영화 상세 쿼리 데이터 조회

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository
      .createQueryBuilder("mul")
      .leftJoinAndSelect("mul.movie", "movie")
      .leftJoinAndSelect("mul.user", "user")
      .where("movie.id IN (:...movieIds)", {
        movieIds,
      })
      .andWhere("user.id = :userId", { userId })
      .getMany();
  }

  // 영화 생성 쿼리

  /* istanbul ignore next */
  async getMovieDetail(movieId: number) {
    return await this.movieRepository
      .createQueryBuilder("movie")
      .leftJoinAndSelect("movie.detail", "detail")
      .leftJoinAndSelect("movie.director", "director")
      .leftJoinAndSelect("movie.genres", "genres")
      .leftJoinAndSelect("movie.creator", "creator")
      .where("movie.id = :id", { id: movieId })
      .getOne();
  }
  // 영화 상세 내용 생성

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    movieDetailId: number,
    movieFolder: string,
    director: Director,
    userId: number,
  ) {
    return await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        movieFilePath: join(
          movieFolder,
          createMovieDto.movieFilePath,
        ),
        director,
        creator: {
          id: userId,
        },
      })
      .execute();
  }

  // 영화 테이블과 장르 테이블 관계 형성

  /* istanbul ignore next */
  async createMovieDetail(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
  ) {
    return await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();
  }

  // 영화 파일 temp => movie 이동

  /* istanbul ignore next */
  async createMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    genres: Genre[],
  ) {
    await qr.manager
      .createQueryBuilder()
      .relation(Movie, "genres")
      .of(movieId)
      .add(genres.map((genre) => genre.id));
  }

  // 영화 수정 쿼리

  /* istanbul ignore next */
  async renameMovieFile(createMovieDto: CreateMovieDto) {
    if (
      this.configService.get<string>(
        envVariablesKeys.ENV,
      ) !== "prod"
    ) {
      const movieFolder = join("public", "movie");
      const tempFolder = join("public", "temp");
      const tempFilePath = join(
        process.cwd(),
        tempFolder,
        createMovieDto.movieFilePath,
      );
      const destinationPath = join(
        process.cwd(),
        movieFolder,
        createMovieDto.movieFilePath,
      );

      try {
        await rename(tempFilePath, destinationPath);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException(
          "동영상 파일 이동 중 오류가 발생했습니다.",
        );
      }
    } else {
      return this.sharedService.saveToPermanentStorage(
        createMovieDto.movieFilePath,
      );
    }
  }

  // 영화 상세 수정

  /* istanbul ignore next */
  async updateMovie(
    qr: QueryRunner,
    movieUpdateFields: UpdateMovieDto,
    movieId: number,
  ) {
    await qr.manager
      .createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where("id = :id", { id: movieId })
      .execute();
  }

  // 영화 <=> 장르 관계 수정

  /* istanbul ignore next */
  async updateMovieDetail(
    qr: QueryRunner,
    detail: string,
    movieId: number,
  ) {
    await qr.manager
      .createQueryBuilder()
      .update(MovieDetail)
      .set({
        detail,
      })
      .where("id = :id", { id: movieId })
      .execute();
  }

  // 영화 삭제 쿼리

  /* istanbul ignore next */
  async updateMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    await qr.manager
      .createQueryBuilder()
      .relation(Movie, "genres")
      .of(movieId)
      .addAndRemove(
        newGenres.map((genre) => genre.id),
        movie.genres.map((genre) => genre.id),
      );
  }

  // 영화 상세 삭제 쿼리

  /* istanbul ignore next */
  async removeMovie(qr: QueryRunner, movieId: number) {
    await qr.manager
      .createQueryBuilder()
      .delete()
      .from(Movie)
      .where("id = :id", { id: movieId })
      .execute();
  }

  // 사용자가 좋아요한 영화 ,중간 테이블에서 조회

  /* istanbul ignore next */
  async removeMovieDetail(
    qr: QueryRunner,
    movieDetailId: number,
  ) {
    await qr.manager
      .createQueryBuilder()
      .delete()
      .from(MovieDetail)
      .where("id = :id", { id: movieDetailId })
      .execute();
  }

  /* istanbul ignore next */
  async getMovieUserLikeRelation(
    movieId: number,
    userId: number,
  ) {
    return await this.movieUserLikeRepository
      .createQueryBuilder("mul")
      .where("mul.movieId = :movieId", { movieId })
      .andWhere("mul.userId = :userId", { userId })
      .getOne();
  }

  // 목록 조회(페이지네이션 및 검색)
  async findAll(getMovieDto: GetMovieDto, userId?: number) {
    const { title } = getMovieDto;
    const qb = await this.getMovies();

    if (title) {
      qb.where("movie.title LIKE :title", {
        title: `%${title}%`,
      });
    }

    const { nextCursor } =
      await this.sharedService.applyCursorPaginationParamsToQb<Movie>(
        qb,
        getMovieDto,
      );

    let [data, count] = await qb.getManyAndCount();

    // data에서 movieId만 뽑아서 배열[movieIds]로 만들기
    // 중간 테이블에서 movieIds 중 userId 있는 데이터 추출
    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length > 0
          ? await this.getLikedMovies(movieIds, userId)
          : [];

      // 해당 유저에 좋아요/싫어요 값이 있는 데아터에서 movieId랑 isLike만 추출

      /**
       * 코팩 센세 로직
       */
      const likeMoviesMap = likedMovies.reduce(
        (acc, cur) => ({
          ...acc,
          [cur.movie.id]: cur.isLike,
        }),
        {},
      );

      data = data.map((d) => ({
        ...d,
        likeStatus:
          d.id in likeMoviesMap
            ? likeMoviesMap[d.id]
            : null,
      }));

      /**
       * 내가 짠 로직
       */
      // const extractNeedData = likedMovies.map(
      //   (likedMovie) => ({
      //     movieId: likedMovie.movie.id,
      //     isLike: likedMovie.isLike,
      //   }),
      // );
      //
      // data = data.map((d) => ({
      //   ...d,
      //   isLike: extractNeedData.some(
      //     (e) => e.movieId === d.id,
      //   )
      //     ? extractNeedData.find((e) => e.movieId === d.id)
      //         .isLike
      //     : null,
      // }));

      return {
        data,
        count,
        nextCursor,
      };
    }

    return {
      data,
      count,
      nextCursor,
    };
  }

  // 상세 조회
  async findOne(id: number) {
    const movie = await this.getMovieDetail(id);

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    return movie;
  }

  // 생성
  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        "존재하지 않는 장르가 있습니다 ." +
          `존재하는 Ids : ${genres.map((genre) => genre.id).join(",")}`,
      );
    }

    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    const movieDetail = await this.createMovieDetail(
      qr,
      createMovieDto,
    );

    const movieDetailId = movieDetail.identifiers[0].id;

    const duplicateMovie = await qr.manager.findOne(Movie, {
      where: {
        title: createMovieDto.title,
      },
    });

    if (duplicateMovie) {
      throw new BadRequestException(
        `이미 존재하는 영화입니다. 영화 제목을 확인해주세요.`,
      );
    }

    const movieFolder = join("public", "movie");

    const movie = await this.createMovie(
      qr,
      createMovieDto,
      movieDetailId,
      movieFolder,
      director,
      userId,
    );

    const movieId = movie.identifiers[0].id;

    await this.createMovieGenreRelation(
      qr,
      movieId,
      genres,
    );

    await this.renameMovieFile(createMovieDto);

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: [
        Relations.MOVIE.DETAIL,
        Relations.MOVIE.DIRECTOR,
        Relations.MOVIE.GENRES,
      ],
    });
  }

  // 수정
  async update(
    id: number,
    updateMovieDto: UpdateMovieDto,
    qr: QueryRunner,
  ) {
    // 영화 상세 조회
    const movie = await qr.manager.findOne(Movie, {
      relations: [
        Relations.MOVIE.DETAIL,
        Relations.MOVIE.DIRECTOR,
        Relations.MOVIE.GENRES,
      ],
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    const { detail, directorId, genreIds, ...movieRest } =
      updateMovieDto;

    // 보낸 감독 ID로 감독 찾기
    let newDirector: Director;
    if (directorId) {
      newDirector = await this.findDirector(directorId, qr);
    }

    // 보낸 장르 ID로 장르 찾기
    let newGenres: Genre[];
    if (genreIds) {
      newGenres = await this.findGenres(genreIds, qr);
    }

    // 영화 수정 필드
    const movieUpdateFields: UpdateMovieDto = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    // 영화 수정
    await this.updateMovie(qr, movieUpdateFields, id);

    // detail이 있다면 detail 수정
    if (detail) {
      await this.updateMovieDetail(
        qr,
        detail,
        movie.detail.id,
      );
    }

    // 장르 수정

    if (newGenres) {
      await this.updateMovieGenreRelation(
        qr,
        id,
        newGenres,
        movie,
      );
    }

    return qr.manager.findOne(Movie, {
      where: {
        id,
      },
      relations: [
        Relations.MOVIE.DETAIL,
        Relations.MOVIE.DIRECTOR,
        Relations.MOVIE.GENRES,
      ],
    });
  }

  // 삭제
  async remove(id: number, qr: QueryRunner) {
    const movie = await qr.manager.findOne(Movie, {
      where: {
        id,
      },
      relations: [Relations.MOVIE.DETAIL],
    });
    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    // 영화 삭제
    await this.removeMovie(qr, id);

    // 영화 상세 삭제
    await this.removeMovieDetail(qr, movie.detail.id);

    return movie;
  }

  // 장르 찾기
  async findGenres(genreIds: number[], qr: QueryRunner) {
    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(genreIds),
      },
    });

    if (genres.length !== genreIds.length) {
      throw new NotFoundException(
        "존재하지 않는 장르가 있습니다 ." +
          `존재하는 Ids : ${genres.map((genre) => genre.id).join(",")}`,
      );
    }

    return genres;
  }

  // 감독 찾기
  async findDirector(directorId: number, qr: QueryRunner) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: directorId,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    return director;
  }

  /**
   * 좋아요,싫어요 주요 로직 메서드
   */
  async likeHandler(
    movieId: number,
    userId: number,
    likeStatus: "LIKE" | "DISLIKE",
  ): Promise<LikeStatusReturnType> {
    const movie = await this.findOne(movieId);
    const user = await this.userService.findOne(userId);

    const movieUserLike =
      await this.getMovieUserLikeRelation(movieId, userId);

    const newLikeStatus = likeStatus === "LIKE";
    const currentLikeStatus = movieUserLike
      ? movieUserLike.isLike
      : null;

    if (currentLikeStatus === null) {
      // 새로 저장
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike: newLikeStatus,
      });
    } else if (currentLikeStatus === newLikeStatus) {
      // 기존 상태와 같은 경우 삭제
      await this.movieUserLikeRepository.delete({
        movie,
        user,
      });
    } else {
      // 상태가 다를 경우 업데이트
      await this.movieUserLikeRepository.update(
        { movie, user },
        { isLike: newLikeStatus },
      );
    }

    const updatedMovieUserLike =
      await this.getMovieUserLikeRelation(movieId, userId);

    return {
      [likeStatus === "LIKE" ? "isLike" : "isDislike"]: !(
        updatedMovieUserLike === null
      ),
    };
  }

  /* istanbul ignore next */
  // likeHandler 유닛 테스트에서 테스트함
  async likeMovie(movieId: number, userId: number) {
    return this.likeHandler(movieId, userId, "LIKE");
  }

  /* istanbul ignore next */
  // likeHandler 유닛 테스트에서 테스트함
  async dislikeMovie(movieId: number, userId: number) {
    return this.likeHandler(movieId, userId, "DISLIKE");
  }
}
