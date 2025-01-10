import { ApiProperty } from "@nestjs/swagger";
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
  @ApiProperty({
    description: "제목",
    example: "어벤져스",
  })
  title: string; // 제목

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "상세 내용",
    example: "어벤져스는 ...",
  })
  detail: string; // 상세 내용

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: "감독 ID",
    example: 1,
  })
  directorId: number; // 감독 ID

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({
    description: "장르 ID",
    example: [1, 2],
  })
  genreIds: number[]; // 장르 ID

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "동영상 파일 경로",
    example: "avengers.mp4",
  })
  movieFilePath: string; // 동영상 파일 경로
}
