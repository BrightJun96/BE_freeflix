import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Director } from "../../director/entities/director.entity";
import { BaseTable } from "../../shared/base-table";
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

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
  })
  director: Director;
}
