import { CacheInterceptor } from "@nestjs/cache-manager";
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
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { QueryRunner as QR } from "typeorm/query-runner/QueryRunner";
import { Public } from "../auth/decorator/public.decorator";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { QueryRunner } from "../shared/decorator/query-runner.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { Role } from "../user/entities/user.entity";
import { CheckAnswerRequestDto } from "./dto/request/check-answer.request.dto";
import { CreateQuizRequestDto } from "./dto/request/create-quiz.request.dto";
import { GetQuizListRequestDto } from "./dto/request/get-quiz-list.request.dto";
import { UpdateQuizRequestDto } from "./dto/request/update-quiz.request.dto";
import { CheckAnswerResponseDto } from "./dto/response/check-answer.response.dto";
import { DeleteQuizResponseDto } from "./dto/response/delete-quiz.response.dto";
import { GetQuizListResponseDto } from "./dto/response/get-quiz-list.response.dto";
import { QuizDetailURLResponseDto } from "./dto/response/get-quiz-url.response.dto";
import { GetQuizSharedDto } from "./dto/shared/get-quiz.shared.dto";
import { CreateQuizService } from "./service/create-quiz.service";
import { QuizListService } from "./service/quiz-list.service";
import { QuizService } from "./service/quiz.service";
import { UpdateQuizService } from "./service/update-quiz.service";

@Controller("quiz")
@ApiTags("퀴즈")
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly createQuizService: CreateQuizService,
    private readonly updateQuizService: UpdateQuizService,
    private readonly quizListService: QuizListService,
  ) {}

  /**
   * ------------------------------
   * 사용자
   * ------------------------------
   */

  /**
   * 퀴즈 상세 - URL
   */
  @Get("detail-url/:detailUrl")
  @Public()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    description: "퀴즈 상세 조회 BY URL",
  })
  @ApiParam({
    name: "detailUrl",
    type: String,
    description: "URL 경로 파라미터",
    example: "next",
  })
  @ApiResponse({
    status: 200,
    type: GetQuizSharedDto,
  })
  async findOneByUrl(
    @Param("detailUrl") url: string,
  ): Promise<GetQuizSharedDto> {
    console.log("detailUrl Cache");
    return await this.quizService.findOneByUrl(url);
  }

  /**
   * 퀴즈 URL 목록
   */
  @Get("detail-urls")
  @Public()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    description: "퀴즈 DETAIL URL 목록",
  })
  @ApiResponse({
    status: 200,
    type: [QuizDetailURLResponseDto],
  })
  async findDetailUrls(): Promise<
    QuizDetailURLResponseDto[]
  > {
    console.log("퀴즈 DETAIL URL 목록");
    return await this.quizService.findDetailUrls();
  }

  /**
   * 정답 확인
   */
  @Post("check-answer")
  @Public()
  @ApiOperation({
    description: "퀴즈 정답 확인",
  })
  @ApiResponse({
    status: 201,
    type: CheckAnswerResponseDto,
  })
  async checkAnswer(
    @Body() checkAnswerRequestDto: CheckAnswerRequestDto,
  ): Promise<CheckAnswerResponseDto> {
    return await this.quizService.checkAnswer(
      checkAnswerRequestDto,
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
  @ApiOperation({
    description: "관리자-퀴즈 목록",
  })
  @ApiResponse({
    status: 200,
    type: GetQuizListResponseDto,
  })
  async findAll(
    @Query() getQuizListDto: GetQuizListRequestDto,
  ): Promise<GetQuizListResponseDto> {
    return await this.quizListService.findAll(
      getQuizListDto,
    );
  }

  /**
   * 퀴즈 생성
   */
  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({
    description: "관리자-퀴즈 생성",
  })
  @ApiResponse({
    status: 200,
    type: GetQuizSharedDto,
  })
  create(
    @Body() createQuizDto: CreateQuizRequestDto,
    @QueryRunner() qr: QR,
  ): Promise<GetQuizSharedDto> {
    return this.createQuizService.create(createQuizDto, qr);
  }

  /**
   * 수정
   */
  @Patch(":id")
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @ApiOperation({
    description: "관리자-퀴즈 수정",
  })
  @ApiResponse({
    status: 200,
    type: GetQuizSharedDto,
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateQuizDto: UpdateQuizRequestDto,
    @QueryRunner() qr: QR,
  ): Promise<GetQuizSharedDto> {
    return this.updateQuizService.update(
      id,
      updateQuizDto,
      qr,
    );
  }

  /**
   * 퀴즈 상세
   */
  @Get(":id")
  @RBAC(Role.admin)
  @ApiOperation({
    description: "관리자-퀴즈 상세",
  })
  @ApiResponse({
    status: 200,
    type: GetQuizSharedDto,
  })
  async findOneById(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<GetQuizSharedDto> {
    return await this.quizService.findOneById(id);
  }
  /**
   * 퀴즈 삭제
   */
  @Delete(":id")
  @RBAC(Role.admin)
  @ApiOperation({
    description: "관리자-퀴즈 삭제",
  })
  @ApiResponse({
    status: 200,
    type: DeleteQuizResponseDto,
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<DeleteQuizResponseDto> {
    return await this.quizService.remove(id);
  }
}
