import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

export interface Movie {
  id: number;
  title: string;
}
@Injectable()
export class MovieService {
  private movies: Movie[] = [
    {
      id: 1,
      title: "해리포터",
    },
    {
      id: 2,
      title: "반지의 제왕",
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
  createMovie(title: string) {
    const newMovie = {
      id: this.counter++,
      title,
    };

    this.movies.push(newMovie);

    return newMovie;
  }

  // 수정
  updateMovie(id: number, title: string) {
    const movie = this.movies.find(
      (movie) => movie.id === id,
    );

    if (!movie) {
      throw new NotFoundException(
        "존재하지 않는 영화입니다.",
      );
    }

    Object.assign(movie, { title });

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
