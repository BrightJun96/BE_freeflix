import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { QueryRunner as QR } from "typeorm";
import { Public } from "../auth/decorator/public.decorator";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
import { Throttle } from "../shared/decorator/throttle.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { PositiveIntPipe } from "../shared/pipe/positive-int.pipe";
import { UserId } from "../user/decorator/user-id.decorator";
import { Role } from "../user/entities/user.entity";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieService } from "./movie.service";

@Controller("movie")
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiTags("영화")
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  @Public()
  @Get()
  @Throttle({
    count: 5,
    unit: "minute",
  })
  getMovies(
    @Query()
    getMovieDto: GetMovieDto,
    @UserId() userId?: number,
  ) {
    return this.movieService.findAll(getMovieDto, userId);
  }

  @Public()
  @Get("recent")
  @ApiOperation({
    description: "최신 영화 조회 API",
  })
  getRecentMovies() {
    return this.movieService.findLatestMovies();
  }

  @Public()
  @Get(":id")
  getMovie(
    @Param(
      "id",
      new ParseIntPipe({
        exceptionFactory() {
          throw new BadRequestException(
            "숫자만 입력해주세요.",
          );
        },
      }),
      PositiveIntPipe,
    )
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() createMovieDto: CreateMovieDto,
    @QueryRunner() qr: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(
      createMovieDto,
      userId,
      qr,
    );
  }

  @Patch(":id")
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  patchMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
    @QueryRunner() qr: QR,
  ) {
    return this.movieService.update(id, updateMovieDto, qr);
  }

  @Delete(":id")
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  deleteMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
    @QueryRunner() qr: QR,
  ) {
    return this.movieService.remove(id, qr);
  }

  // 좋아요
  @Post(":id/like")
  @ApiOperation({
    description: "좋아요 API",
  })
  likeMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe)
    movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.likeMovie(movieId, userId);
  }

  // 싫어요
  @Post(":id/dislike")
  @ApiOperation({
    description: "싫어요 API",
  })
  dislikeMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe)
    movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.dislikeMovie(movieId, userId);
  }
}
