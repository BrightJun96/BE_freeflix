import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

// 영화 제목 검증 파이프
@Injectable()
export class MovieTitleValidationPipe
  implements PipeTransform<string, string>
{
  transform(value: string): string {
    if (!value) {
      return;
    }
    // 영화 제목 길이 검증
    if (value.length < 2) {
      throw new BadRequestException(
        `영화 제목은 2자 이상 입력해주세요.`,
      );
    }

    return value;
  }
}
