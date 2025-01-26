import { Injectable } from "@nestjs/common";
import { QueryRunner } from "typeorm";
import { Relations } from "../../shared/const/relation.const";
import { UpdateMultipleChoiceDto } from "../dto/request/update-multiple-choice.dto";
import { UpdateQuizMetaDataDto } from "../dto/request/update-quiz-meta-data.dto";
import { UpdateQuizDto } from "../dto/request/update-quiz.dto";
import { GetQuizResponseDto } from "../dto/response/get-quiz.response.dto";
import { MultipleChoice } from "../entities/multiple-choice.entity";
import { QuizMetaData } from "../entities/quiz-meta-data.entity";
import { Quiz } from "../entities/quiz.entity";

@Injectable()
export class UpdateQuizService {
  /**
   * 퀴즈 수정
   */
  async update(
    id: number,
    updateQuizDto: UpdateQuizDto,
    qr: QueryRunner,
  ): Promise<GetQuizResponseDto> {
    const quiz = await qr.manager.findOne(Quiz, {
      relations: [
        Relations.QUIZ.META,
        Relations.QUIZ.MULTIPLE,
      ],
      where: {
        id,
      },
    });

    if (updateQuizDto.quizMetaData) {
      await this.updateMetaData(
        quiz.quizMetaData.id,
        updateQuizDto.quizMetaData,
        qr,
      );
    }

    if (updateQuizDto.multipleChoices) {
      await this.updateMultipleChoice(
        updateQuizDto.multipleChoices,
        qr,
      );
    }

    await this.updateQuiz(updateQuizDto, quiz.id, qr);

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
   * 메타 데이터 수정
   */

  async updateMetaData(
    metaId: number,
    updateQuizMetaDataDto: UpdateQuizMetaDataDto,
    qr: QueryRunner,
  ) {
    await qr.manager
      .createQueryBuilder()
      .update(QuizMetaData)
      .set(updateQuizMetaDataDto)
      .where("id=:id", {
        id: metaId,
      })
      .execute();
  }

  /**
   * 객관식 답안 수정
   */
  async updateMultipleChoice(
    multipleChoices: UpdateMultipleChoiceDto[],
    qr: QueryRunner,
  ) {
    const ids = multipleChoices.map((choice) => choice.id); // 업데이트할 ID 추출

    const contentCase = multipleChoices
      .map((choice) =>
        choice.content
          ? `WHEN id = ${choice.id} THEN '${choice.content}'`
          : "",
      )
      .join(" ");

    await qr.manager
      .createQueryBuilder()
      .update(MultipleChoice)
      .set({
        content: () =>
          `CASE ${contentCase} ELSE content END`,
        // order: () => `CASE ${orderCase} ELSE "order" END`,
      })
      .where("id IN (:...ids)", { ids })
      .execute();
  }

  /**
   * 퀴즈 수정
   */
  async updateQuiz(
    updateQuizDto: UpdateQuizDto,
    quizId: number,
    qr: QueryRunner,
  ) {
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
        id: quizId,
      })
      .execute();
  }
}
