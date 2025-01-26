import { ApiProperty } from "@nestjs/swagger";

export class GetQuizMultipleChoiceSharedDto {
  @ApiProperty({
    description: "PK",
    example: "1",
  })
  id: number;

  @ApiProperty({
    description: "문제 내용",
    example: "react는 SPA프레임워크입니다....",
  })
  content: string; //
}
