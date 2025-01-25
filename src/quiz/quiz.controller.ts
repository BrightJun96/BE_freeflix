import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { QueryRunner as QR } from "typeorm/query-runner/QueryRunner";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { Role } from "../user/entities/user.entity";
import { CheckAnswerDto } from "./dto/check-answer.dto";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { QuizService } from "./quiz.service";

@Controller("quiz")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * ------------------------------
   * 사용자
   * ------------------------------
   */

  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @Get(":id")
  async findOneById(@Param("id", ParseIntPipe) id: number) {
    return await this.quizService.findOneById(id);
  }

  /**
   * 퀴즈 상세 - URL
   */
  @Get("url/:detailUrl")
  async findOneByUrl(@Param("detailUrl") url: string) {
    return await this.quizService.findOneByUrl(url);
  }

  /**
   * 정답 확인
   */
  @Post("check-answer")
  async checkAnswer(
    @Body() checkAnswerDto: CheckAnswerDto,
  ) {
    return await this.quizService.checkAnswer(
      checkAnswerDto,
    );
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.quizService.update(+id, updateQuizDto);
  }

  /**
   * ------------------------------
   * 관리자
   * ------------------------------
   */
  /**
   * 퀴즈 생성
   */
  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  create(
    @Body() createQuizDto: CreateQuizDto,
    @QueryRunner() qr: QR,
  ) {
    return this.quizService.create(createQuizDto, qr);
  }

  /**
   * 퀴즈 삭제
   */
  @Delete(":id")
  @RBAC(Role.admin)
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.findOneById(id);

    await this.quizService.remove(id);

    return {
      removeStatus: true,
    };
  }
}
