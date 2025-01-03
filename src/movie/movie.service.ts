import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
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
  ) {}

  // 목록 조회
  async findAll(title?: string) {
    if (!title)
      return await this.movieRepository.find({
        relations: [
          Relations.DETAIL,
          Relations.DIRECTOR,
          Relations.GENRES,
        ],
      });

    return await this.movieRepository.find({
      where: {
        title: ILike(`%${title}%`),
      },
      relations: [
        Relations.DETAIL,
        Relations.DIRECTOR,
        Relations.GENRES,
      ],
    });
  }

  // 상세 조회
  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: [
        Relations.DETAIL,
        Relations.DIRECTOR,
        Relations.GENRES,
      ],
    });

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    return movie;
  }

  // 생성
  async create(createMovieDto: CreateMovieDto) {
    const genres = await this.findGenres(
      createMovieDto.genreIds,
    );

    const director = await this.findDirector(
      createMovieDto.directorId,
    );

    return await this.movieRepository.save({
      title: createMovieDto.title,
      detail: { detail: createMovieDto.detail },
      director,
      genres,
    });
  }

  // 수정
  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.findOne(id);

    const { detail, directorId, genreIds, ...movieRest } =
      updateMovieDto;

    let newDirector: Director;
    if (directorId) {
      newDirector = await this.findDirector(directorId);
    }

    let newGenres: Genre[];
    if (genreIds) {
      newGenres = await this.findGenres(genreIds);
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    await this.movieRepository.update(
      id,
      movieUpdateFields,
    );

    if (detail) {
      await this.movieDetailRepository.update(
        movie.detail.id,
        { detail },
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: [
        Relations.DETAIL,
        Relations.DIRECTOR,
        Relations.GENRES,
      ],
    });
    newMovie.genres = newGenres;

    await this.movieRepository.save(newMovie);

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

    await this.movieRepository.delete(id);

    await this.movieDetailRepository.delete(
      movie.detail.id,
    );

    return movie;
  }

  // 장르 찾기
  async findGenres(genreIds: number[]) {
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

    return genres;
  }

  // 감독 찾기
  async findDirector(directorId: number) {
    const director = await this.directorRepository.findOne({
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
