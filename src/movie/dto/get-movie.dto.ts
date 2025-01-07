import { IsOptional, IsString } from "class-validator";
import { CursorPaginationDto } from "../../shared/dto/cursor-pagination.dto";

export class GetMovieDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
