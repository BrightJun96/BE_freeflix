import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { SharedModule } from "../shared/shared.module";
import { MovieDetail } from "./entities/movie-detail.entity";
import { Movie } from "./entities/movie.entity";
import { MovieController } from "./movie.controller";
import { MovieService } from "./movie.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
    ]),
    SharedModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
