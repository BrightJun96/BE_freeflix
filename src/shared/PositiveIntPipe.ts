import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

// 양수 필터
@Injectable()
export class PositiveIntPipe
  implements PipeTransform<number, number>
{
  transform(value: number): number {
    if (value <= 0) {
      throw new BadRequestException(
        `0이상의 숫자를 입력해주세요. 입력값: ${value}`,
      );
    }
    return value;
  }
}
