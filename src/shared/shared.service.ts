import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import * as AWS from "aws-sdk";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { SelectQueryBuilder } from "typeorm";
import { v4 as Uuid } from "uuid";
import { envVariablesKeys } from "./const/env.const";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";
import { PagePaginationDto } from "./dto/page-pagination.dto";

@Injectable()
export class SharedService {
  private s3: S3;
  constructor(
    private readonly configService: ConfigService,
  ) {
    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    AWS.config.update({
      credentials: {
        accessKeyId: configService.get<string>(
          envVariablesKeys.AWS_ACCESS_KEY_ID,
        ),
        secretAccessKey: configService.get<string>(
          envVariablesKeys.AWS_SECRET_ACCESS_KEY,
        ),
      },
      region: configService.get<string>(
        envVariablesKeys.AWS_REGION,
      ),
    });

    this.s3 = new S3({
      credentials: {
        accessKeyId: configService.get<string>(
          envVariablesKeys.AWS_ACCESS_KEY_ID,
        ),
        secretAccessKey: configService.get<string>(
          envVariablesKeys.AWS_SECRET_ACCESS_KEY,
        ),
      },

      region: configService.get<string>(
        envVariablesKeys.AWS_REGION,
      ),
    });
  }

  async saveToPermanentStorage(fileName: string) {
    try {
      const bucketName = this.configService.get<string>(
        envVariablesKeys.BUCKET_NAME,
      );

      await this.s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/public/temp/${fileName}`,
        Key: `public/movie/${fileName}`,
        ACL: "public-read",
      });

      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: `public/temp/${fileName}`,
      });
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(
        "S3 파일 위치 변경 에러",
      );
    }
  }

  async createPresignedURL(expiresIn = 300) {
    const params = {
      Bucket: this.configService.get<string>(
        envVariablesKeys.BUCKET_NAME,
      ),
      Key: `public/temp/${Uuid()}.mp4`,
      Expires: expiresIn,
      ACL: "public-read",
    };

    try {
      return await getSignedUrl(
        this.s3,
        new PutObjectCommand(params),
        {
          expiresIn:
            "/* add value from 'Expires' from v2 call if present, else remove */",
        },
      );
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(
        "S3 Presigned URL 생성 실패",
      );
    }
  }

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
