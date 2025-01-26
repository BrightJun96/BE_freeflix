import { ApiProperty } from "@nestjs/swagger";

export class GetQuizMetaDataSharedDto {
  @ApiProperty({
    description: "PK",
    example: "1",
  })
  id: number;

  @ApiProperty({
    description: "SEO 메타 제목",
    example: "react 퀴즈",
  })
  seoMetaTitle: string; //

  @ApiProperty({
    description: "SEO 메타 설명",
    example: "react 관련 퀴즈입니다.",
  })
  seoMetaDescription: string;

  @ApiProperty({
    description: "SEO 퀴즈 이미지",
    example: "https://s3.sdfsfsdfsdfds.com",
  })
  metaImageUrl?: string;
}
