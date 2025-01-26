import { OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { GetQuizMultipleChoiceDto } from "../shared/get-quiz-multiple-choice.dto";

export class CreateMultipleChoiceDto extends OmitType(
  GetQuizMultipleChoiceDto,
  ["id"],
) {
  @IsNotEmpty()
  @IsString()
  content: string; // 문제 내용
}
