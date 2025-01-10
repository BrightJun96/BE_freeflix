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
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";

@Controller("user")
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiTags("USER")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.userService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.userService.remove(+id);
  }
}
