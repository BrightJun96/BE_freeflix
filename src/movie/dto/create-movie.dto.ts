import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string; // 제목

  @IsNotEmpty()
  @IsString()
  detail: string; // 상세 내용

  @IsNotEmpty()
  @IsNumber()
  directorId: number; // 감독 ID

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  genreIds: number[]; // 장르 ID
}
