import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";

export interface Movie {
  id: number;
  title: string;
  genre: string;
}
@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      title: "해리포터",
      genre: "판타지",
    },
    {
      id: 2,
      title: "반지의 제왕",
      genre: "액션",
    },
  ];
  private counter = 3;

  // 목록 조회
  getManyMovies(title?: string) {
    if (!title) return this.movies;

    return this.movies.filter((movie) =>
      movie.title.startsWith(title),
    );
  }

  // 상세 조회
  getMovieById(id: number) {
    const movie = this.movies.find(
      (movie) => movie.id === id,
    );

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    return movie;
  }

  // 생성
  createMovie(createMovieDto: CreateMovieDto) {
    const newMovie = {
      id: this.counter++,
      ...createMovieDto,
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  // 수정
  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find(
      (movie) => movie.id === id,
    );

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    Object.assign(movie, updateMovieDto);

    return movie;
  }

  // 삭제
  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex(
      (movie) => movie.id === id,
    );

    if (movieIndex === -1) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    this.movies.splice(movieIndex, 1);
    return movieIndex;
  }
}
