import { ApiProperty } from "@nestjs/swagger";
import { GetQuizDto } from "../shared/get-quiz.dto";

/**
 * 퀴즈 목록 응답 DTO
 */
export class GetQuizListResponseDto {
  @ApiProperty({
    description: "퀴즈 데이터 목록",
  })
  data: GetQuizDto[];
  @ApiProperty({
    description: "데이터 갯수",
    example: 10,
  })
  count: number;
  @ApiProperty({
    description: "다음 요청할 커서",
    example:
      "eyJ2YWx1ZXMiOnsiaWQiOjR9LCJvcmRlcnMiOlsiaWRfREVTQyJdfQ==",
  })
  nextCursor: string;
}
