import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

@Injectable()
export class IntegerPipe
  implements PipeTransform<number, number>
{
  transform(value: number): number {
    if (Number.isInteger(value)) {
      throw new BadRequestException(`정수를 입력해주세요.`);
    }

    return value;
  }
}
