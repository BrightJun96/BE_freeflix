import { ApiProperty } from "@nestjs/swagger";

export class CheckAnswerDto {
  @ApiProperty({
    description: "QUIZ PK",
    example: 1,
  })
  quizId: number;

  @ApiProperty({
    description: "정답",
    example: 2,
  })
  answer: number;
}
