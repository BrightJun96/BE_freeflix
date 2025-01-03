import { Module } from "@nestjs/common";
import {
  ConfigModule,
  ConfigService,
} from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";
import { MovieDetail } from "./movie/entities/movie-detail.entity";
import { Movie } from "./movie/entities/movie.entity";
import { MovieModule } from "./movie/movie.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      // 어떤 파일에서든 process.env로 접근 가능토록 하는 설정
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid("dev", "prod").required(),
        DB_TYPE: Joi.string().valid("postgres").required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(
          "DB_TYPE",
        ) as "postgres",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_DATABASE"),
        entities: [Movie, MovieDetail],
        synchronize: true,
        // logging: true,
      }),
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRoot({
    //   type: process.env.DB_TYPE as "postgres",
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   entities: [],
    //   synchronize: true,
    // }),
    MovieModule,
  ],
})
export class AppModule {}
