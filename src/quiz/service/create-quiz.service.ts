import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { Relations } from "../../shared/const/relation.const";
import { CreateMultipleChoiceDto } from "../dto/create-multiple-choice.dto";
import { CreateQuizMetaDataDto } from "../dto/create-quiz-meta-data.dto";
import { CreateQuizDto } from "../dto/create-quiz.dto";
import { MultipleChoice } from "../entities/multiple-choice.entity";
import { QuizMetaData } from "../entities/quiz-meta-data.entity";
import { Quiz } from "../entities/quiz.entity";

@Injectable()
export class CreateQuizService {
  constructor() {}

  /**
   * 퀴즈 생성
   */
  async create(
    createQuizDto: CreateQuizDto,
    qr: QueryRunner,
  ) {
    const duplicationUrlQuiz = await qr.manager.findOne(
      Quiz,
      {
        where: {
          detailUrl: createQuizDto.detailUrl,
        },
      },
    );

    if (duplicationUrlQuiz) {
      throw new BadRequestException(
        "detailUrl은 중복되면 안됩니다.",
      );
    }

    const quizMetaData = await this.createQuizMetaData(
      createQuizDto.quizMetaData,
      qr,
    );

    const metaDataId = quizMetaData.identifiers[0].id;

    const quiz = await this.createQuiz(
      createQuizDto,
      metaDataId,
      qr,
    );

    const quizId = quiz.identifiers[0].id;

    await this.createMultipleChoices(
      createQuizDto.multipleChoices,
      quizId,
      qr,
    );

    return qr.manager.findOne(Quiz, {
      relations: [
        Relations.QUIZ.META,
        Relations.QUIZ.MULTIPLE,
      ],
      where: {
        id: quizId,
      },
    });
  }

  /**
   * 퀴즈 메타 데이터 생성
   */
  async createQuizMetaData(
    metaData: CreateQuizMetaDataDto,
    qr: QueryRunner,
  ) {
    return await qr.manager
      .createQueryBuilder()
      .insert()
      .into(QuizMetaData)
      .values(metaData)
      .execute();
  }

  /**
   * 퀴즈 객관식 문제 생성
   */
  async createMultipleChoices(
    multipleChoicesDto: CreateMultipleChoiceDto[],
    quizId: number,
    qr: QueryRunner,
  ) {
    // 각 DTO에 quiz 관계 추가
    const choicesWithQuiz = multipleChoicesDto.map(
      (choice) => ({
        ...choice,
        quiz: { id: quizId }, // 퀴즈 ID 설정
      }),
    );

    return await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MultipleChoice)
      .values(choicesWithQuiz)
      .execute();
  }

  /**
   * 퀴즈 생성
   */
  async createQuiz(
    createQuizDto: CreateQuizDto,
    metaDataId: number,
    qr: QueryRunner,
  ) {
    return await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Quiz)
      .values({
        title: createQuizDto.title,
        content: createQuizDto.content,
        explanation: createQuizDto.explanation,
        detailUrl: createQuizDto.detailUrl,
        field: createQuizDto.field,
        answer: createQuizDto.answer,
        quizMetaData: { id: metaDataId },
      })
      .execute();
  }
}
