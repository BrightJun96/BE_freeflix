import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Director } from "../director/entities/director.entity";
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
  ) {}

  // 목록 조회
  async findAll(title?: string) {
    if (!title)
      return await this.movieRepository.find({
        relations: [Relations.DETAIL, Relations.DIRECTOR],
      });

    return await this.movieRepository.find({
      where: {
        title: ILike(`%${title}%`),
      },
      relations: [Relations.DETAIL, Relations.DIRECTOR],
    });
  }

  // 상세 조회
  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: [Relations.DETAIL, Relations.DIRECTOR],
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
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    return await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: { detail: createMovieDto.detail },
      director,
    });
  }

  // 수정
  async update(id: number, updateMovieDto: UpdateMovieDto) {
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

    const { detail, directorId, ...movieRest } =
      updateMovieDto;

    let newDirector: Director;
    if (directorId) {
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

      newDirector = director;
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

    return await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: [Relations.DETAIL, Relations.DIRECTOR],
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
}
