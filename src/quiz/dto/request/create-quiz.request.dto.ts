import { OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field } from "../../entities/quiz.entity";
import { GetQuizDto } from "../shared/get-quiz.dto";
import { CreateMultipleChoiceRequestDto } from "./create-multiple-choice.request.dto";
import { CreateQuizMetaDataDtoRequest } from "./create-quiz-meta-data.dto.request";

// 퀴즈 생성 DTO
export class CreateQuizRequestDto extends OmitType(
  GetQuizDto,
  ["id", "quizMetaData", "multipleChoices"],
) {
  @IsNotEmpty()
  @IsString()
  title: string; // 퀴즈 제목

  @IsNotEmpty()
  @IsString()
  content: string; // 퀴즈 내용

  @IsNotEmpty()
  @IsString()
  explanation: string; // 퀴즈 해설

  @IsNotEmpty()
  @IsString()
  detailUrl: string; // 상세 URL

  @IsNotEmpty()
  @IsEnum(Field)
  field: Field; // 퀴즈 분야

  @IsNotEmpty()
  @IsNumber()
  answer: number; // 정답 번호

  @ValidateNested()
  @Type(() => CreateQuizMetaDataDtoRequest)
  quizMetaData: CreateQuizMetaDataDtoRequest; // 메타데이터 DTO

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMultipleChoiceRequestDto)
  multipleChoices: CreateMultipleChoiceRequestDto[]; // 객관식 문제 배열
}
