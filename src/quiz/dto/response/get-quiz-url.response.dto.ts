import { ApiProperty } from "@nestjs/swagger";

/**
 * 퀴즈 상세 응답 DTO
 */
export class QuizDetailURLResponseDto {
  @ApiProperty({
    description: "상세 URL",
    example: "react",
  })
  detailUrl: string;
}
