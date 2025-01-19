import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";

// QueryRunner 인스턴스 검증
export const WsQueryRunner = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const client = context.switchToWs().getClient();

    if (
      !client ||
      !client.data ||
      !client.data.queryRunner
    ) {
      throw new InternalServerErrorException(
        "QueryRunner is not found",
      );
    }

    return client.data.queryRunner;
  },
);
