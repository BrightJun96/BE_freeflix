import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { PagePaginationDto } from "./dto/page-pagination.dto";

@Injectable()
export class SharedService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    pagePaginationDto: PagePaginationDto,
  ) {
    const { page, take } = pagePaginationDto;
    qb.skip((page - 1) * take).take(take);
  }

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    cursorPaginationDto: CursorPaginationDto,
  ) {
    const { cursor, order, take } = cursorPaginationDto;

    if (cursor) {
    }

    for (let i = 0; i < order.length; i++) {
      const [column, direction] = order[i].split("_");

      if (direction !== "ASC" && direction !== "DESC") {
        throw new BadRequestException(
          "Order는 ASC 또는 DESC로 설정해야 합니다.",
        );
      }

      if (i === 0) {
        qb.orderBy(`${qb.alias}.${column}`, direction);
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction);
      }
    }

    qb.take(take);

    const results = await qb.getMany();

    const nextCursor = this.generateNextCursor(
      results,
      order,
    );

    return {
      qb,
      nextCursor,
    };
  }

  // @description 프론트에 보내줄 다음 커서 ,프론트는 이 다음 커서를 가지고 다음 페이지를 요청
  // 서버에서 만들어드릴게
  generateNextCursor<T>(
    results: T[],
    orders: string[],
  ): string | null {
    if (results.length === 0) return null;

    const lastItem = results[results.length - 1];

    const values = {};

    orders.forEach((order) => {
      const [column] = order.split("_");
      values[column] = lastItem[column];
    });
    const cursorObj = {
      values,
      orders,
    };

    return Buffer.from(JSON.stringify(cursorObj)).toString(
      "base64",
    );
  }
}
