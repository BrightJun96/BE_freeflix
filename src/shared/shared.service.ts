import { Injectable } from "@nestjs/common";
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

  applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    cursorPaginationDto: CursorPaginationDto,
  ) {
    const { id, order, take } = cursorPaginationDto;

    if (id) {
      const direction = order === "ASC" ? ">" : "<";
      qb.where(`${qb.alias}.id ${direction} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order).take(take);
  }
}
