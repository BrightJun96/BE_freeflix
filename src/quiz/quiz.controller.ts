import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Public } from "../auth/decorator/public.decorator";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { QuizService } from "./quiz.service";

@Controller("quiz")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @Public()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.quizService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizService.update(+id, updateQuizDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.quizService.remove(+id);
  }
}
