import { IsNotEmpty, IsNumber } from "class-validator";
import { CheckAnswerDto } from "../shared/check-answer.dto";

export class CheckAnswerRequestDto extends CheckAnswerDto {
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @IsNotEmpty()
  @IsNumber()
  answer: number;
}
