import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import {
  ConfigModule,
  ConfigService,
} from "@nestjs/config";
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
} from "@nestjs/core";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard } from "./auth/guard/auth.guard";
import { RbacGuard } from "./auth/guard/rbac.guard";
import { BearerTokenMiddleware } from "./auth/middleware/bearer-token.middleware";
import { DirectorModule } from "./director/director.module";
import { Director } from "./director/entities/director.entity";
import { Genre } from "./genre/entities/genre.entity";
import { GenreModule } from "./genre/genre.module";
import { MovieDetail } from "./movie/entities/movie-detail.entity";
import { Movie } from "./movie/entities/movie.entity";
import { MovieModule } from "./movie/movie.module";
import { envVariablesKeys } from "./shared/const/env.const";
import { QueryFailedFilter } from "./shared/filter/query-failed.filter";
import { ResponseTimeInterceptor } from "./shared/interceptor/response-time.interceptor";
import { User } from "./user/entities/user.entity";
import { UserModule } from "./user/user.module";

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
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(
          envVariablesKeys.DB_TYPE,
        ) as "postgres",
        host: configService.get<string>(
          envVariablesKeys.DB_HOST,
        ),
        port: configService.get<number>(
          envVariablesKeys.DB_PORT,
        ),
        username: configService.get<string>(
          envVariablesKeys.DB_USERNAME,
        ),
        password: configService.get<string>(
          envVariablesKeys.DB_PASSWORD,
        ),
        database: configService.get<string>(
          envVariablesKeys.DB_DATABASE,
        ),
        entities: [
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
        ],
        synchronize: true,
        // logging: true,
      }),

      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "public"),
      serveRoot: "/public/",
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        {
          path: "/auth/login",
          method: RequestMethod.POST,
        },
        {
          path: "/auth/register",
          method: RequestMethod.POST,
        },
      )
      .forRoutes("*");
  }
}
