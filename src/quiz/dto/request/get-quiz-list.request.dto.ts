import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { CursorPaginationDto } from "../../../shared/dto/cursor-pagination.dto";
import { Field } from "../../entities/quiz.entity";

export class GetQuizListRequestDto extends CursorPaginationDto {
  @ApiPropertyOptional({ description: "제목 검색 필터" })
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional({ description: "내용 검색 필터" })
  @IsString()
  @IsOptional()
  content: string;

  @ApiPropertyOptional({ description: "설명 검색 필터" })
  @IsString()
  @IsOptional()
  explanation: string;

  @ApiPropertyOptional({
    description: "세부 URL 검색 필터",
  })
  @IsString()
  @IsOptional()
  detailUrl: string;

  @ApiPropertyOptional({
    description: "분야 필터",
    enum: Field,
  })
  @IsEnum(Field)
  @IsOptional()
  field: Field;
}
