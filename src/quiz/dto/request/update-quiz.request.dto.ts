import { OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Field } from "../../entities/quiz.entity";
import { GetQuizSharedDto } from "../shared/get-quiz.shared.dto";
import { UpdateMultipleChoiceRequestDto } from "./update-multiple-choice.request.dto";
import { UpdateQuizMetaDataRequestDto } from "./update-quiz-meta-data.request.dto";

export class UpdateQuizRequestDto extends OmitType(
  GetQuizSharedDto,
  ["id", "quizMetaData", "multipleChoices"],
) {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  detailUrl?: string;

  @IsOptional()
  @IsEnum(Field)
  field?: Field;

  @IsOptional()
  @IsNumber()
  answer?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQuizMetaDataRequestDto)
  quizMetaData?: UpdateQuizMetaDataRequestDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMultipleChoiceRequestDto)
  multipleChoices?: UpdateMultipleChoiceRequestDto[];
}
