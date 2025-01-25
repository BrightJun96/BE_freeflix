import { IsNotEmpty, IsNumber } from "class-validator";

export class CheckAnswerDto {
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @IsNotEmpty()
  @IsNumber()
  answer: number;
}
