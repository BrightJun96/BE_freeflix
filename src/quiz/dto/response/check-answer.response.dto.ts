import { ApiProperty } from "@nestjs/swagger";

/**
 * 정답확인 응답 DTO
 */
export class CheckAnswerResponseDto {
  @ApiProperty({
    description: "정답 여부",
    example: true,
  })
  isCorrect: boolean;
}
