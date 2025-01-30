import { Controller } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DirectorService } from "./director.service";

@Controller("director")
@ApiBearerAuth()
@ApiTags("감독")
export class DirectorController {
  constructor(
    private readonly directorService: DirectorService,
  ) {}

  // @Post()
  // create(@Body() createDirectorDto: CreateDirectorDto) {
  //   return this.directorService.create(createDirectorDto);
  // }
  //
  // @Get()
  // findAll() {
  //   return this.directorService.findAll();
  // }
  //
  // @Get(":id")
  // findOne(
  //   @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  // ) {
  //   return this.directorService.findOne(id);
  // }
  //
  // @Patch(":id")
  // update(
  //   @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  //   @Body() updateDirectorDto: UpdateDirectorDto,
  // ) {
  //   return this.directorService.update(
  //     id,
  //     updateDirectorDto,
  //   );
  // }
  //
  // @Delete(":id")
  // remove(
  //   @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  // ) {
  //   return this.directorService.remove(id);
  // }
}
