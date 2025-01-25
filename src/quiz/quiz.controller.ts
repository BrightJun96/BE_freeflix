import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { QueryRunner as QR } from "typeorm/query-runner/QueryRunner";
import { Public } from "../auth/decorator/public.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { QuizService } from "./quiz.service";

@Controller("quiz")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @Public()
  @UseInterceptors(TransactionInterceptor)
  create(
    @Body() createQuizDto: CreateQuizDto,
    @QueryRunner() qr: QR,
  ) {
    return this.quizService.create(createQuizDto, qr);
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
