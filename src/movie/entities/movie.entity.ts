import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseTable } from "../../shared/BaseTable";
import { MovieDetail } from "./movie-detail.entity";

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(
    () => MovieDetail,
    (movieDetail) => movieDetail.id,
    {
      cascade: true,
    },
  )
  @JoinColumn()
  detail: MovieDetail;
}
