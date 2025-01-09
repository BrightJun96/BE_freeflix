import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from "@nestjs/common";

// QueryRunner 인스턴스 검증
export const QueryRunner = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    if (!request || !request.queryRunner) {
      throw new InternalServerErrorException(
        "QueryRunner is not found",
      );
    }

    return request.queryRunner;
  },
);
