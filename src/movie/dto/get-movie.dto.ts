import { IsOptional, IsString } from "class-validator";
import { PagePaginationDto } from "../../shared/dto/page-pagination.dto";

export class GetMovieDto extends PagePaginationDto {
  @IsString()
  @IsOptional()
  title?: string;
}
