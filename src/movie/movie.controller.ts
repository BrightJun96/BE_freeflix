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
import { QueryRunner as QR } from "typeorm";
import { Public } from "../auth/decorator/public.decorator";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
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
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  @Public()
  @Get()
  getMovies(
    @Query()
    getMovieDto: GetMovieDto,
  ) {
    return this.movieService.findAll(getMovieDto);
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
  patchMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.movieService.update(
      Number(id),
      updateMovieDto,
    );
  }

  @Delete(":id")
  // @RBAC(Role.admin)
  deleteMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.movieService.remove(Number(id));
  }
}
