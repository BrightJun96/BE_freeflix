import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

export class UpdateDirectorDto {
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsDateString()
  dob?: Date;

  @IsNotEmpty()
  @IsOptional()
  nationality?: string;
}
