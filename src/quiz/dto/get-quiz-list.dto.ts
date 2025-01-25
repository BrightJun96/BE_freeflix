import {
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { CursorPaginationDto } from "../../shared/dto/cursor-pagination.dto";
import { Field } from "../entities/quiz.entity";

export class GetQuizListDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsOptional()
  explanation: string;

  @IsString()
  @IsOptional()
  detailUrl: string;

  @IsEnum(Field)
  @IsOptional()
  field: Field;
}
