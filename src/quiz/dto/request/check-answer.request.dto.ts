import { IsNotEmpty, IsNumber } from "class-validator";
import { CheckAnswerSharedDto } from "../shared/check-answer.shared.dto";

export class CheckAnswerRequestDto extends CheckAnswerSharedDto {
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @IsNotEmpty()
  @IsNumber()
  answer: number;
}
