import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { Movie } from "./entities/movie.entity";

@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private counter = 3;

  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = "영화1";
    movie1.genre = "장르1";

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = "영화2";
    movie2.genre = "장르2";

    this.movies.push(movie1, movie2);
  }

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
