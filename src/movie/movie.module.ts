import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { SharedModule } from "../shared/shared.module";
import { UserModule } from "../user/user.module";
import { MovieDetail } from "./entities/movie-detail.entity";
import { MovieUserLike } from "./entities/movie-user-like";
import { Movie } from "./entities/movie.entity";
import { MovieController } from "./movie.controller";
import { MovieService } from "./movie.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      MovieUserLike,
      Director,
      Genre,
    ]),
    SharedModule,
    UserModule,
    CacheModule.register({
      ttl: 3000,
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
