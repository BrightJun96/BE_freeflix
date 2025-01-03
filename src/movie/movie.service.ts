import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
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
  ) {}

  // 목록 조회
  async findAll(title?: string) {
    if (!title)
      return await this.movieRepository.find({
        relations: [Relations.DETAIL],
      });

    return await this.movieRepository.find({
      where: {
        title: ILike(`%${title}%`),
      },
      relations: [Relations.DETAIL],
    });
  }

  // 상세 조회
  async findOne(id: number) {
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

    return movie;
  }

  // 생성
  async create(createMovieDto: CreateMovieDto) {
    return await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: { detail: createMovieDto.detail },
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

    const { detail, ...movieRest } = updateMovieDto;

    await this.movieRepository.update(id, movieRest);

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
      relations: [Relations.DETAIL],
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
