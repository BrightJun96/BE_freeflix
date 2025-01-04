import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  In,
  QueryRunner,
  Repository,
} from "typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { Relations } from "./constant/relations";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieDetail } from "./entities/movie-detail.entity";
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
    private readonly dataSource: DataSource,
  ) {}

  // 목록 조회
  async findAll(title?: string) {
    const qb = this.movieRepository
      .createQueryBuilder("movie")
      .leftJoinAndSelect("movie.detail", "detail")
      .leftJoinAndSelect("movie.director", "director")
      .leftJoinAndSelect("movie.genres", "genres");

    if (title) {
      qb.where("movie.title ILIKE :title", {
        title: `%${title}%`,
      });
    }
    return await qb.getManyAndCount();

    // if (!title)
    //   return await this.movieRepository.find({
    //     relations: [
    //       Relations.DETAIL,
    //       Relations.DIRECTOR,
    //       Relations.GENRES,
    //     ],
    //   });
    //
    // return await this.movieRepository.find({
    //   where: {
    //     title: ILike(`%${title}%`),
    //   },
    //   relations: [
    //     Relations.DETAIL,
    //     Relations.DIRECTOR,
    //     Relations.GENRES,
    //   ],
    // });
  }

  // 상세 조회
  async findOne(id: number, qr?: QueryRunner) {
    if (qr) {
      const movie = await qr.manager
        .createQueryBuilder(Movie, "movie")
        .leftJoinAndSelect("movie.detail", "detail")
        .leftJoinAndSelect("movie.director", "director")
        .leftJoinAndSelect("movie.genres", "genres")
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
  async create(createMovieDto: CreateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
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

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: {
            id: movieDetailId,
          },
          director,
          // genres, ManyToMany 안됨.
        })
        .execute();

      const movieId = movie.identifiers[0].id;

      await qr.manager
        .createQueryBuilder()
        .relation(Movie, "genres")
        .of(movieId)
        .add(genres.map((genre) => genre.id));

      await qr.commitTransaction();

      return await this.findOne(movieId);
      //
      // return await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: { detail: createMovieDto.detail },
      //   director,
      //   genres,
      // });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
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

      throw new NotFoundException("에러 일부러 발생");

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
}
