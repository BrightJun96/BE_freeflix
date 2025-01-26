import { PartialType } from "@nestjs/mapped-types";
import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Field, Quiz } from "../../entities/quiz.entity";
import { GetQuizMetaDataSharedDto } from "./get-quiz-meta-data.shared.dto";
import { GetQuizMultipleChoiceSharedDto } from "./get-quiz-multiple-choice.shared.dto";

/**
 * 퀴즈 상세  응답 DTO
 */

export class GetQuizSharedDto extends PartialType(
  OmitType(Quiz, ["quizMetaData", "multipleChoices"]),
) {
  @ApiProperty({
    description: "PK",
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: "퀴즈 문제",
    example: "다음은 react 관련 문제입니다.",
  })
  title?: string;

  @ApiProperty({
    description: "퀴즈 내용",
    example: "react는 SPA 프레임워크입니다..",
  })
  content?: string;

  @ApiProperty({
    description: "퀴즈 해설",
    example: "state는 리렌더링을 해줍니다..",
  })
  explanation?: string;

  @ApiProperty({
    description: "상세 URL",
    example: "react",
  })
  detailUrl?: string;

  @ApiProperty({
    description: "퀴즈 분야",
    example: "FRONTEND",
  })
  field?: Field; //

  @ApiProperty({
    description: "정답 번호",
    example: "1",
  })
  answer?: number; // 정답 번호

  @ApiProperty({
    description: "SEO 관련 사용될 데이터",
  })
  quizMetaData: GetQuizMetaDataSharedDto;

  @ApiProperty({
    description: "객관식 답안지들",
  })
  multipleChoices: GetQuizMultipleChoiceSharedDto[];
}
