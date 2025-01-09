import { Transform } from "class-transformer";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Director } from "../../director/entities/director.entity";
import { Genre } from "../../genre/entities/genre.entity";
import { DOMAIN_URL } from "../../shared/const/domain.const";
import { BaseTable } from "../../shared/entity/base-table";
import { MovieDetail } from "./movie-detail.entity";

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  title: string;

  @Column({
    default: 0,
  })
  likeCount: number;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @OneToOne(
    () => MovieDetail,
    (movieDetail) => movieDetail.id,
    {
      cascade: true,
      nullable: false,
    },
  )
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(({ value }) => `${DOMAIN_URL}/${value}`)
  movieFilePath: string;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;
}
