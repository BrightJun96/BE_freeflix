import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PositiveIntPipe } from "../shared/pipe/positive-int.pipe";
import { CreateGenreDto } from "./dto/create-genre.dto";
import { UpdateGenreDto } from "./dto/update-genre.dto";
import { GenreService } from "./genre.service";

@Controller("genre")
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiTags("장르")
export class GenreController {
  constructor(
    private readonly genreService: GenreService,
  ) {}

  @Post()
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  ) {
    return this.genreService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genreService.update(id, updateGenreDto);
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  ) {
    return this.genreService.remove(id);
  }
}
