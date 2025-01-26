import { CacheModule } from "@nestjs/cache-manager";
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import {
  ConditionalModule,
  ConfigModule,
  ConfigService,
} from "@nestjs/config";
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
} from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard } from "./auth/guard/auth.guard";
import { RbacGuard } from "./auth/guard/rbac.guard";
import { BearerTokenMiddleware } from "./auth/middleware/bearer-token.middleware";
import { ChatModule } from "./chat/chat.module";
import { ChatRoom } from "./chat/entities/chat-room.entity";
import { Chat } from "./chat/entities/chat.entity";
import { DirectorModule } from "./director/director.module";
import { Director } from "./director/entities/director.entity";
import { FileUploadModule } from "./file-upload/file-upload.module";
import { Genre } from "./genre/entities/genre.entity";
import { GenreModule } from "./genre/genre.module";
import { MovieDetail } from "./movie/entities/movie-detail.entity";
import { MovieUserLike } from "./movie/entities/movie-user-like.entity";
import { Movie } from "./movie/entities/movie.entity";
import { MovieModule } from "./movie/movie.module";
import { MultipleChoice } from "./quiz/entities/multiple-choice.entity";
import { QuizMetaData } from "./quiz/entities/quiz-meta-data.entity";
import { Quiz } from "./quiz/entities/quiz.entity";
import { QuizModule } from "./quiz/quiz.module";
import { envVariablesKeys } from "./shared/const/env.const";
import { QueryFailedFilter } from "./shared/filter/query-failed.filter";
import { ResponseTimeInterceptor } from "./shared/interceptor/response-time.interceptor";
import { ResponseTransformerInterceptor } from "./shared/interceptor/response-transformer.interceptor";
import { ThrottleInterceptor } from "./shared/interceptor/throttle.interceptor";
import { User } from "./user/entities/user.entity";
import { UserModule } from "./user/user.module";
import { WorkerModule } from "./worker/worker.module";

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      // 어떤 파일에서든 process.env로 접근 가능토록 하는 설정
      isGlobal: true,
      envFilePath:
        // process.env.NODE_ENV === "test"
        //   ? "test.env"
        //   :
        ".env",
      validationSchema: Joi.object({
        ENV: Joi.string()
          .valid("test", "dev", "prod")
          .required(),
        DB_TYPE: Joi.string().valid("postgres").required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        BUCKET_NAME: Joi.string().required(),
      }),
    }),
    // TypeORM 설정
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
          MovieUserLike,
          Director,
          Genre,
          User,
          Chat,
          ChatRoom,
          Quiz,
          QuizMetaData,
          MultipleChoice,
        ],
        synchronize: true,
        // ssl: {
        //   rejectUnauthorized: false,
        // },
        // configService.get<string>(
        //   envVariablesKeys.ENV,
        // ) !== "prod",
        // ...(configService.get<string>(
        //   envVariablesKeys.ENV,
        // ) === "prod" && {
        //   ssl: {
        //     rejectUnauthorized: false,
        //   },
        // }),
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
    FileUploadModule,
    QuizModule,
    CacheModule.register({
      ttl: 0,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ChatModule,
    ConditionalModule.registerWhen(
      WorkerModule,
      (env: NodeJS.ProcessEnv) => env["TYPE"] === "worker",
    ),
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
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
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
