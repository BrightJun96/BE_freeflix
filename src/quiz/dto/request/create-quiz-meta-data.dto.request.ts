import { OmitType } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { GetQuizMetaDataDto } from "../shared/get-quiz-meta-data.dto";

export class CreateQuizMetaDataDtoRequest extends OmitType(
  GetQuizMetaDataDto,
  ["id"],
) {
  @IsNotEmpty()
  @IsString()
  seoMetaTitle: string; // SEO 메타 제목
  @IsNotEmpty()
  @IsString()
  seoMetaDescription: string; // SEO 메타 설명

  @IsOptional()
  @IsString()
  metaImageUrl?: string; // 선택적 이미지 URL
}
