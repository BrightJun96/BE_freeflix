import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "커서",
    example:
      "eyJ2YWx1ZXMiOnsiaWQiOjR9LCJvcmRlcnMiOlsiaWRfREVTQyJdfQ==",
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: "정렬 기준(내림 차순/오름 차순)",
    example: ["id_DESC"],
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value],
  )
  order: string[] = ["id_DESC"]; // 정렬 기준

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: "가져올 데이터 수",
    example: 5,
  })
  take: number = 5; // 한 번에 가져올 데이터 수
}
