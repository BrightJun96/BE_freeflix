import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import e from "express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { Director } from "../director/entities/director.entity";
import { Genre } from "../genre/entities/genre.entity";
import { SharedModule } from "../shared/shared.module";
import { MIME_TYPE } from "./constant/mime-type";
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
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), "public", "movie"),
        filename(
          req: e.Request,
          file: Express.Multer.File,
          callback: (
            error: Error | null,
            filename: string,
          ) => void,
        ) {
          const split = file.originalname.split(".");

          let extension = MIME_TYPE.MP4;

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          callback(
            null,
            `${v4()}-${Date.now()}.${extension}`,
          );
        },
      }),
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
