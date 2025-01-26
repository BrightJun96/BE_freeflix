import { IsNotEmpty, IsNumber } from "class-validator";

export class CheckAnswerRequestDto {
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @IsNotEmpty()
  @IsNumber()
  answer: number;
}
