import { Injectable } from "@nestjs/common";
import { SelectQueryBuilder } from "typeorm";
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
}
