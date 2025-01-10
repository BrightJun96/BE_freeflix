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
import { SharedService } from "../shared/shared.service";
import { UserService } from "../user/user.service";
import { Relations } from "./constant/relations";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieDetail } from "./entities/movie-detail.entity";
import { MovieUserLike } from "./entities/movie-user-like";
import { Movie } from "./entities/movie.entity";

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
  ) {}

  // 목록 조회
  async findAll(getMovieDto: GetMovieDto, userId?: number) {
    const { title, cursor } = getMovieDto;
    const qb = this.movieRepository
      .createQueryBuilder("movie")
      .leftJoinAndSelect("movie.detail", "detail")
      .leftJoinAndSelect("movie.director", "director")
      .leftJoinAndSelect("movie.genres", "genres");

    if (cursor) {
      const { values, orders } = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8"),
      );

      const comparisonOperator = orders.some((order) =>
        order.endsWith("DESC"),
      )
        ? "<"
        : ">";

      const columns = Object.keys(values);

      const whereConditions = columns
        .map((key) => `${qb.alias}."${key}"`)
        .join(",");

      const whereParams = columns
        .map((v) => `:${v}`)
        .join(",");

      const query = `(${whereConditions}) ${comparisonOperator} (${whereParams})`;
      qb.where(query, values);

      getMovieDto.order = orders;
    }
    if (getMovieDto.order) {
      getMovieDto.order.forEach((o, index) => {
        const [column, direction] = o.split("_");

        if (direction !== "ASC" && direction !== "DESC") {
          throw new BadRequestException(
            "Order는 ASC 또는 DESC로 설정해야 합니다.",
          );
        }

        if (index === 0) {
          qb.orderBy(`${qb.alias}.${column}`, direction);
        } else {
          qb.addOrderBy(`${qb.alias}.${column}`, direction);
        }
      });
    }

    // qb.orderBy();
    if (title) {
      qb.where(" movie.title ILIKE :title", {
        title: `%${title}%`,
      });
    }

    const { nextCursor } =
      await this.sharedService.applyCursorPaginationParamsToQb<Movie>(
        qb,
        getMovieDto,
      );

    let [data, count] = await qb.getManyAndCount();

    const movieIds = data.map((movie) => movie.id);
    // data에서 movieId만 뽑아서 배열[movieIds]로 만들기
    // 중간 테이블에서 movieIds 중 userId 있는 데이터 추출
    if (userId) {
      const likedMovies =
        movieIds.length > 0
          ? await this.movieUserLikeRepository
              .createQueryBuilder("mul")
              .leftJoinAndSelect("mul.movie", "movie")
              .leftJoinAndSelect("mul.user", "user")
              .where("movie.id IN (:...movieIds)", {
                movieIds,
              })
              .andWhere("user.id = :userId", { userId })
              .getMany()
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

  // 상세 조회
  async findOne(id: number, qr?: QueryRunner) {
    if (qr) {
      const movie = await qr.manager
        .createQueryBuilder(Movie, "movie")
        .leftJoinAndSelect("movie.detail", "detail")
        .leftJoinAndSelect("movie.director", "director")
        .leftJoinAndSelect("movie.genres", "genres")
        .leftJoinAndSelect("movie.creator", "creator")
        .where("movie.id = :id", { id })
        .getOne();

      if (!movie) {
        throw new NotFoundException(
          "존재하지 않는 영화입니다.",
        );
      }

      return movie;
    } else {
      const qb = this.movieRepository
        .createQueryBuilder("movie")
        .leftJoinAndSelect("movie.detail", "detail")
        .leftJoinAndSelect("movie.director", "director")
        .leftJoinAndSelect("movie.genres", "genres")
        .where("movie.id = :id", { id });

      const movie = await qb.getOne();

      if (!movie) {
        throw new NotFoundException(
          "존재하지 않는 영화입니다.",
        );
      }

      return movie;

      // const movie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: [
      //     Relations.DETAIL,
      //     Relations.DIRECTOR,
      //     Relations.GENRES,
      //   ],
      // });
      //
      // if (!movie) {
      //   throw new NotFoundException(
      //     "존재하지 않는 영화입니다.",
      //   );
      // }
      //
      // return movie;
    }
  }

  // 생성
  async create(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const genres = await this.findGenres(
      createMovieDto.genreIds,
      qr,
    );

    const director = await this.findDirector(
      createMovieDto.directorId,
      qr,
    );

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const duplicateMovie =
      await this.movieRepository.findOne({
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
    const tempFolder = join("public", "temp");

    const movie = await qr.manager
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

    const movieId = movie.identifiers[0].id;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, "genres")
      .of(movieId)
      .add(genres.map((genre) => genre.id));

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
    return await this.findOne(movieId, qr);
  }

  // 수정
  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 영화 상세 조회
      const movie = await this.findOne(id, qr);

      const { detail, directorId, genreIds, ...movieRest } =
        updateMovieDto;

      // 보낸 감독 ID로 감독 찾기
      let newDirector: Director;
      if (directorId) {
        newDirector = await this.findDirector(
          directorId,
          qr,
        );
      }

      // 보낸 장르 ID로 장르 찾기
      let newGenres: Genre[];
      if (genreIds) {
        newGenres = await this.findGenres(genreIds, qr);
      }

      // 영화 수정 필드
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      // 영화 수정
      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where("id = :id", { id })
        .execute();
      // await this.movieRepository.update(
      //   id,
      //   movieUpdateFields,
      // );

      // detail이 있다면 detail 수정
      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({
            detail,
          })
          .where("id = :id", { id: movie.detail.id })
          .execute();

        // await this.movieDetailRepository.update(
        //   movie.detail.id,
        //   { detail },
        // );
      }

      // 장르 수정

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, "genres")
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }
      // const newMovie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: [
      //     Relations.DETAIL,
      //     Relations.DIRECTOR,
      //     Relations.GENRES,
      //   ],
      // });
      // newMovie.genres = newGenres;
      // await this.movieRepository.save(newMovie);

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: [
          Relations.DETAIL,
          Relations.DIRECTOR,
          Relations.GENRES,
        ],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  // 삭제
  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: [Relations.DETAIL],
    });
    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    // 영화 삭제
    // await this.movieRepository.delete(id);
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where("id = :id", { id })
      .execute();

    // 영화 상세 삭제
    await this.movieDetailRepository.delete(
      movie.detail.id,
    );

    return movie;
  }

  // 장르 찾기
  async findGenres(genreIds: number[], qr?: QueryRunner) {
    if (qr) {
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
    } else {
      const genres = await this.genreRepository.find({
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

      return;
    }
  }

  // 감독 찾기
  async findDirector(directorId: number, qr?: QueryRunner) {
    if (qr) {
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
    } else {
      const director =
        await this.directorRepository.findOne({
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
  }

  async likeMovie(movieId: number, userId: number) {
    return this.likeHandler(movieId, userId, "LIKE");
  }

  async dislikeMovie(movieId: number, userId: number) {
    return this.likeHandler(movieId, userId, "DISLIKE");
  }

  async likeHandler(
    movieId: number,
    userId: number,
    likeStatus: "LIKE" | "DISLIKE",
  ) {
    const movie = await this.findOne(movieId);
    const user = await this.userService.findOne(userId);

    const movieUserLike = await this.movieUserLikeRepository
      .createQueryBuilder("mul")
      .where("mul.movieId = :movieId", { movieId })
      .andWhere("mul.userId = :userId", { userId })
      .getOne();

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

    const status = await this.movieUserLikeRepository
      .createQueryBuilder("mul")
      .where("mul.movieId = :movieId", { movieId })
      .andWhere("mul.userId = :userId", { userId })
      .getOne();

    return {
      [likeStatus === "LIKE" ? "isLike" : "isDislike"]: !(
        status === null
      ),
    };
  }
}
