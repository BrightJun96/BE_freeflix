import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { QueryRunner as QR } from "typeorm/query-runner/QueryRunner";
import { Public } from "../auth/decorator/public.decorator";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { Role } from "../user/entities/user.entity";
import { CheckAnswerDto } from "./dto/check-answer.dto";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { GetQuizListDto } from "./dto/get-quiz-list.dto";
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

  /**
   * 퀴즈 상세 - URL
   */
  @Get("url/:detailUrl")
  @Public()
  async findOneByUrl(@Param("detailUrl") url: string) {
    return await this.quizService.findOneByUrl(url);
  }

  /**
   * 퀴즈 URL 목록
   */
  @Get("detail-urls")
  @Public()
  async findDetailUrls() {
    return await this.quizService.findDetailUrls();
  }

  /**
   * 정답 확인
   */
  @Post("check-answer")
  @Public()
  async checkAnswer(
    @Body() checkAnswerDto: CheckAnswerDto,
  ) {
    return await this.quizService.checkAnswer(
      checkAnswerDto,
    );
  }

  /**
   * ------------------------------
   * 관리자
   * ------------------------------
   */

  /**
   * 퀴즈 목록
   */
  @Get()
  @RBAC(Role.admin)
  async findAll(@Query() getQuizListDto: GetQuizListDto) {
    return await this.quizService.findAll(getQuizListDto);
  }

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
   * 수정
   */
  @Patch(":id")
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateQuizDto: UpdateQuizDto,
    @QueryRunner() qr: QR,
  ) {
    return this.quizService.update(id, updateQuizDto, qr);
  }

  /**
   * 퀴즈 상세
   */
  @Get(":id")
  @RBAC(Role.admin)
  async findOneById(@Param("id", ParseIntPipe) id: number) {
    return await this.quizService.findOneById(id);
  }
  /**
   * 퀴즈 삭제
   */
  @Delete(":id")
  @RBAC(Role.admin)
  async remove(@Param("id", ParseIntPipe) id: number) {
    return await this.quizService.remove(id);
  }
}
