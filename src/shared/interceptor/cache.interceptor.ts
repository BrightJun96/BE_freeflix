import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const requestAPI = `[${req.method}-${req.path}]`;

    if (this.cache.has(requestAPI)) {
      return of(this.cache.get(requestAPI));
    }

    // if(cache.)
    return next.handle().pipe(
      tap((response) => {
        this.cache.set(requestAPI, response);
      }),
    );
  }
}
