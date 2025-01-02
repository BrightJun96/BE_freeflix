import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { Movie } from "./entities/movie.entity";

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  // 목록 조회
  async getManyMovies(title?: string) {
    if (!title) return await this.movieRepository.find();

    return await this.movieRepository.find({
      where: {
        title: ILike(`%${title}%`),
      },
    });

    // if (!title) return this.movies;
    //
    // return this.mvies.filter((movie) =>
    //   movie.title.startsWith(title),
    // );
  }

  // 상세 조회
  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    return movie;
  }

  // 생성
  async createMovie(createMovieDto: CreateMovieDto) {
    return await this.movieRepository.save(createMovieDto);
  }

  // 수정
  async updateMovie(
    id: number,
    updateMovieDto: UpdateMovieDto,
  ) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    await this.movieRepository.update(id, updateMovieDto);

    return await this.movieRepository.findOne({
      where: {
        id,
      },
    });
  }

  // 삭제
  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });
    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    await this.movieRepository.delete(id);
    return movie;
  }
}
