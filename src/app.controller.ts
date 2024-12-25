import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("movie")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("")
  getMovies(@Query("title") title?: string) {
    return this.appService.getManyMovies(title);
  }

  @Get(":id")
  getMovie(@Param("id") id: string) {
    return this.appService.getMovieById(Number(id));
  }

  @Post("")
  postMovie(@Body("title") title: string) {
    return this.appService.createMovie(title);
  }

  @Patch(":id")
  patchMovie(
    @Param("id") id: string,
    @Body("title") title: string,
  ) {
    return this.appService.updateMovie(Number(id), title);
  }

  @Delete(":id")
  deleteMovie(@Param("id") id: string) {
    return this.appService.deleteMovie(Number(id));
  }
}
