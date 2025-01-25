import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Relations } from "../../shared/const/relation.const";
import { CheckAnswerDto } from "../dto/check-answer.dto";
import { Quiz } from "../entities/quiz.entity";

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  /**
   * 퀴즈 상세 - ID
   */
  async findOneById(id: number) {
    const quiz = await this.quizRepository.findOne({
      relations: [
        Relations.QUIZ.MULTIPLE,
        Relations.QUIZ.META,
      ],
      where: {
        id,
      },
    });

    if (!quiz) {
      throw new NotFoundException(
        "해당 퀴즈가 존재하지 않습니다.",
      );
    }

    return quiz;
  }

  /**
   * 퀴즈 상세 - URL
   */
  async findOneByUrl(url: string) {
    const quiz = await this.quizRepository.findOne({
      where: {
        detailUrl: url,
      },
      relations: [
        Relations.QUIZ.MULTIPLE,
        Relations.QUIZ.META,
      ],
    });

    if (!quiz) {
      throw new NotFoundException(
        "해당 퀴즈가 존재하지 않습니다.",
      );
    }

    return quiz;
  }

  /**
   * 정답 확인
   */
  async checkAnswer({ quizId, answer }: CheckAnswerDto) {
    const quiz = await this.findOneById(quizId);

    return {
      isCorrect: quiz.answer === answer,
    };
  }

  /**
   * 퀴즈 삭제
   */
  async remove(id: number) {
    await this.findOneById(id);

    await this.quizRepository.delete(id);

    return {
      removeStatus: true,
    };
  }

  /**
   * 퀴즈 URL 목록
   */
  async findDetailUrls() {
    return await this.quizRepository
      .createQueryBuilder("quiz")
      .select(["quiz.detailUrl"])
      .orderBy("RANDOM()") // PostgreSQL에서는 RANDOM(), MySQL에서는 RAND() 사용
      .getMany();
  }
}
