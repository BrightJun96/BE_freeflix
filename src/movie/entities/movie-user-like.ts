import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Movie } from "./movie.entity";

// 중간 테이블
@Entity()
export class MovieUserLike {
  @PrimaryColumn({ name: "movieId", type: "int8" })
  @ManyToOne(() => Movie, (movie) => movie.likedMovies, {
    onDelete: "CASCADE",
  })
  movie: Movie;

  @PrimaryColumn({ name: "userId", type: "int8" })
  @ManyToOne(() => User, (user) => user.likedUsers, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column()
  isLike: boolean;
}
