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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PositiveIntPipe } from "../shared/pipe/positive-int.pipe";
import { DirectorService } from "./director.service";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { UpdateDirectorDto } from "./dto/update-director.dto";

@Controller("director")
@ApiBearerAuth()
@ApiTags("감독")
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
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  ) {
    return this.directorService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
    @Body() updateDirectorDto: UpdateDirectorDto,
  ) {
    return this.directorService.update(
      id,
      updateDirectorDto,
    );
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  ) {
    return this.directorService.remove(id);
  }
}
