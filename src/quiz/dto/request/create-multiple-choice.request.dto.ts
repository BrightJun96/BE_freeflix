import { OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { GetQuizMultipleChoiceSharedDto } from "../shared/get-quiz-multiple-choice.shared.dto";

export class CreateMultipleChoiceRequestDto extends OmitType(
  GetQuizMultipleChoiceSharedDto,
  ["id"],
) {
  @IsNotEmpty()
  @IsString()
  content: string; // 문제 내용
}
