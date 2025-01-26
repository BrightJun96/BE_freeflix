import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CursorPaginationDto } from "../../shared/dto/cursor-pagination.dto";

export class GetMovieDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "제목",
    example: "어벤져스",
    required: false,
  })
  title?: string;
}
