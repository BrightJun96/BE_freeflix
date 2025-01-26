import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SharedService } from "../../shared/shared.service";
import { GetQuizListRequestDto } from "../dto/request/get-quiz-list.request.dto";
import { GetQuizListResponseDto } from "../dto/response/get-quiz-list.response.dto";
import { Quiz } from "../entities/quiz.entity";

@Injectable()
export class QuizListService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly sharedService: SharedService,
  ) {}

  /**
   * 퀴즈 목록
   */
  async findAll(
    getQuizListDto: GetQuizListRequestDto,
  ): Promise<GetQuizListResponseDto> {
    const qb =
      this.quizRepository.createQueryBuilder("quiz");

    const {
      title,
      content,
      explanation,
      field,
      detailUrl,
    } = getQuizListDto;

    // 동적 조건을 담을 배열
    const conditions = [];
    const params = {};

    if (title) {
      conditions.push("quiz.title LIKE :title");
      params["title"] = `%${title}%`;
    }
    if (content) {
      conditions.push("quiz.content LIKE :content");
      params["content"] = `%${content}%`;
    }
    if (explanation) {
      conditions.push("quiz.explanation LIKE :explanation");
      params["explanation"] = `%${explanation}%`;
    }
    if (field) {
      conditions.push("quiz.field LIKE :field");
      params["field"] = `%${field}%`;
    }
    if (detailUrl) {
      conditions.push("quiz.detailUrl LIKE :detailUrl");
      params["detailUrl"] = `%${detailUrl}%`;
    }

    // 동적 조건을 WHERE에 추가
    if (conditions.length > 0) {
      qb.where(conditions.join(" AND "), params);
    }

    const { nextCursor } =
      await this.sharedService.applyCursorPaginationParamsToQb<Quiz>(
        qb,
        getQuizListDto,
      );

    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      count,
      nextCursor,
    };
  }
}
