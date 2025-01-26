import { IsNotEmpty, IsString } from "class-validator";

export class CreateMultipleChoiceDto {
  @IsNotEmpty()
  @IsString()
  content: string; // 문제 내용

  // @IsNotEmpty()
  // @IsString()
  // order: string; // 문제 순서
}
