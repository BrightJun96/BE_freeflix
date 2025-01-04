import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { PositiveIntPipe } from "../shared/pipe/positive-int-pipe";
import { DirectorService } from "./director.service";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { UpdateDirectorDto } from "./dto/update-director.dto";

@Controller("director")
export class DirectorController {
  constructor(
    private readonly directorService: DirectorService,
  ) {}

  @Post()
  create(@Body() createDirectorDto: CreateDirectorDto) {
    return this.directorService.create(createDirectorDto);
  }

  @Get()
  findAll() {
    return this.directorService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.directorService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
    @Body() updateDirectorDto: UpdateDirectorDto,
  ) {
    return this.directorService.update(
      Number(id),
      updateDirectorDto,
    );
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.directorService.remove(Number(id));
  }
}
