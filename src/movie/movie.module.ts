import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MovieDetail } from "./entities/movie-detail.entity";
import { Movie } from "./entities/movie.entity";
import { MovieController } from "./movie.controller";
import { MovieService } from "./movie.service";

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieDetail])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
