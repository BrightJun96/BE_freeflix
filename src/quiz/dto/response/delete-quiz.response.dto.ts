import { ApiProperty } from "@nestjs/swagger";

export class DeleteQuizResponseDto {
  @ApiProperty({
    description: "퀴즈 삭제 상태",
    example: true,
  })
  removeStatus: boolean;
}
