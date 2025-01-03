import { IsNotEmpty } from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  title: string; // 제목

  @IsNotEmpty()
  genre: string; // 장르

  @IsNotEmpty()
  detail: string; // 상세 내용
}
