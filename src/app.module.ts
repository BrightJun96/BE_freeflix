import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MovieModule } from "./movie/movie.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "jjalseu",
      password: "love9785@@",
      database: "mydatabase",
      entities: [],
      synchronize: true,
    }),
    MovieModule,
  ],
})
export class AppModule {}
