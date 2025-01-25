import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { Relations } from "../shared/const/relation.const";
import { CheckAnswerDto } from "./dto/check-answer.dto";
import { CreateMultipleChoiceDto } from "./dto/create-multiple-choice.dto";
import { CreateQuizMetaDataDto } from "./dto/create-quiz-meta-data.dto";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { MultipleChoice } from "./entities/multiple-choice.entity";
import { QuizMetaData } from "./entities/quiz-meta-data.entity";
import { Quiz } from "./entities/quiz.entity";

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizMetaData)
    private readonly quizMetaDataRepository: Repository<QuizMetaData>,
    @InjectRepository(MultipleChoice)
    private readonly multipleChoiceRepository: Repository<MultipleChoice>,
  ) {}

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

  findAll() {
    return `This action returns all quiz`;
  }

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
   * 퀴즈 수정
   */
  async update(
    id: number,
    updateQuizDto: UpdateQuizDto,
    qr: QueryRunner,
  ) {
    const quiz = await this.findOneById(id);

    if (updateQuizDto.quizMetaData) {
      await qr.manager
        .createQueryBuilder()
        .update(QuizMetaData)
        .set(updateQuizDto.quizMetaData)
        .where("id=:id", {
          id: quiz.quizMetaData.id,
        })
        .execute();
    }

    if (updateQuizDto.multipleChoices) {
      const ids = updateQuizDto.multipleChoices.map(
        (choice) => choice.id,
      ); // 업데이트할 ID 추출

      const contentCase = updateQuizDto.multipleChoices
        .map((choice) =>
          choice.content
            ? `WHEN id = ${choice.id} THEN '${choice.content}'`
            : "",
        )
        .join(" ");
      const orderCase = updateQuizDto.multipleChoices
        .map((choice) =>
          choice.order
            ? `WHEN id = ${choice.id} THEN '${choice.order}'`
            : "",
        )
        .join(" ");

      await qr.manager
        .createQueryBuilder()
        .update(MultipleChoice)
        .set({
          content: () =>
            `CASE ${contentCase} ELSE content END`,
          order: () => `CASE ${orderCase} ELSE "order" END`,
        })
        .where("id IN (:...ids)", { ids })
        .execute();
    }

    await qr.manager
      .createQueryBuilder()
      .update(Quiz)
      .set({
        title: updateQuizDto.title,
        content: updateQuizDto.content,
        explanation: updateQuizDto.explanation,
        detailUrl: updateQuizDto.detailUrl,
        field: updateQuizDto.field,
        answer: updateQuizDto.answer,
      })
      .where("id=:id", {
        id,
      })

      .execute();

    return qr.manager.findOne(Quiz, {
      relations: [
        Relations.QUIZ.META,
        Relations.QUIZ.MULTIPLE,
      ],
      where: {
        id,
      },
    });
  }

  /**
   * 퀴즈 삭제
   * @param id
   */
  async remove(id: number) {
    await this.findOneById(id);

    await this.quizRepository.delete(id);

    return {
      removeStatus: true,
    };
  }
}
