import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieService } from "./movie.service";

@Controller("movie")
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  @Get("")
  getMovies(@Query("title") title?: string) {
    return this.movieService.findAll(title);
  }

  @Get(":id")
  getMovie(@Param("id") id: string) {
    return this.movieService.findOne(Number(id));
  }

  @Post("")
  postMovie(@Body() createMovieDto: CreateMovieDto) {
    return this.movieService.create(createMovieDto);
  }

  @Patch(":id")
  patchMovie(
    @Param("id") id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.movieService.update(
      Number(id),
      updateMovieDto,
    );
  }

  @Delete(":id")
  deleteMovie(@Param("id") id: string) {
    return this.movieService.remove(Number(id));
  }
}
