import { IsInt, IsOptional } from "class-validator";

// 페이지네이션 DTO
export class PagePaginationDto {
  @IsInt()
  @IsOptional()
  page: number = 1; // 페이지 번호

  @IsInt()
  @IsOptional()
  take: number = 5; // 한 번에 가져올 데이터 수
}
