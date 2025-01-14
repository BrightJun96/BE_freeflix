import { Exclude } from "class-transformer";
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { MovieUserLike } from "../../movie/entities/movie-user.like";
import { Movie } from "../../movie/entities/movie.entity";
import { BaseTable } from "../../shared/entity/base-table";

export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    toPlainOnly: true, // 응답할 때 제외
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @OneToMany(() => Movie, (movie) => movie.creator)
  createdMovies: Movie[];

  @OneToMany(() => MovieUserLike, (mul) => mul.user)
  likedUsers: MovieUserLike[];
}
