import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsNumber } from "class-validator";
import { CreateMultipleChoiceDto } from "./create-multiple-choice.dto";

export class UpdateMultipleChoiceDto extends PartialType(
  CreateMultipleChoiceDto,
) {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
