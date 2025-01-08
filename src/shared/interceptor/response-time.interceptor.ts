import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

// API 요청에 대한 응답 시간을 측정하는 인터셉터
@Injectable()
export class ResponseTimeInterceptor
  implements NestInterceptor
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const requestTime = Date.now();

    return next.handle().pipe(
      // delay(1000),
      tap(() => {
        const responseTime = Date.now();
        const diff = responseTime - requestTime;

        if (diff > 1000) {
          console.log(
            `!!!TIME OUT [${req.method} ${req.path}] ${diff}ms`,
          );

          throw new InternalServerErrorException(
            "시간이 너무 오래걸렸습니다!",
          );
        } else {
          console.log(
            `[${req.method} ${req.path}] ${diff}ms`,
          );
        }
      }),
    );
  }
}
