import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  order: string[] = ["id_DESC"]; // 정렬 기준

  @IsInt()
  @IsOptional()
  take: number = 5; // 한 번에 가져올 데이터 수
}
