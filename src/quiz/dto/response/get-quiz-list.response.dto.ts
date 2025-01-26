import { ApiProperty } from "@nestjs/swagger";
import { GetQuizSharedDto } from "../shared/get-quiz.shared.dto";

/**
 * 퀴즈 목록 응답 DTO
 */
export class GetQuizListResponseDto {
  @ApiProperty({
    description: "퀴즈 데이터 목록",
  })
  data: GetQuizSharedDto[];
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
