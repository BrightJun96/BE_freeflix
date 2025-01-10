import {
  Cache,
  CACHE_MANAGER,
} from "@nestjs/cache-manager";
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import {
  IThrottleOptions,
  Throttle,
} from "../decorator/throttle.decorator";

export class ThrottleInterceptor
  implements NestInterceptor
{
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const userID = request?.user?.sub;

    if (!userID) {
      return next.handle();
    }
    const throttleOptions =
      this.reflector.get<IThrottleOptions>(
        Throttle,
        context.getHandler(),
      );

    if (!throttleOptions) {
      return next.handle();
    }

    const minute = new Date().getMinutes();

    const cacheKey = `${request.method}_${request.path}_user${userID}_minute${minute}`;

    const count =
      (await this.cacheManager.get<number>(cacheKey)) ?? 0;

    if (count >= throttleOptions.count) {
      throw new ForbiddenException(
        "API 요청 횟수 초과하셨습니다.",
      );
    }

    return next.handle().pipe(
      tap(async () => {
        await this.cacheManager.set(
          cacheKey,
          count + 1,
          60000,
        );
      }),
    );
  }
}
