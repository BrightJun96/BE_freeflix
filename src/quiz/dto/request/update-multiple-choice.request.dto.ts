import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsNumber } from "class-validator";
import { CreateMultipleChoiceRequestDto } from "./create-multiple-choice.request.dto";

export class UpdateMultipleChoiceRequestDto extends PartialType(
  CreateMultipleChoiceRequestDto,
) {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
