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
import { UpdateMultipleChoiceDto } from "./update-multiple-choice.dto";
import { UpdateQuizMetaDataDto } from "./update-quiz-meta-data.dto";

export class UpdateQuizDto {
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
  @Type(() => UpdateQuizMetaDataDto)
  quizMetaData?: UpdateQuizMetaDataDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMultipleChoiceDto)
  multipleChoices?: UpdateMultipleChoiceDto[];
}
