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
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Public } from "../auth/decorator/public.decorator";
import { AuthGuard } from "../auth/guard/auth.guard";
import { PositiveIntPipe } from "../shared/pipe/positive-int.pipe";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieService } from "./movie.service";
import { MovieTitleValidationPipe } from "./pipe/movie-title-validation.pipe";

@Controller("movie")
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  @Public()
  @Get()
  getMovies(
    @Query("title", MovieTitleValidationPipe)
    title?: string,
  ) {
    return this.movieService.findAll(title);
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
    console.log(typeof id);
    return this.movieService.findOne(id);
  }

  @Post("")
  @UseGuards(AuthGuard)
  postMovie(@Body() createMovieDto: CreateMovieDto) {
    return this.movieService.create(createMovieDto);
  }

  @Patch(":id")
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
  deleteMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.movieService.remove(Number(id));
  }
}
