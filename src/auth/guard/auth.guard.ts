import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { AUTH_CONST } from "../const/auth";
import { Public } from "../decorator/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.get(
      Public,
      context.getHandler(),
    );

    if (isPublic) return true;
    // 요청에서 req.user 확인
    const request = context.switchToHttp().getRequest();

    if (
      !request.user ||
      request.user.type !== AUTH_CONST.ACCESS_TOKEN
    ) {
      return false;
    }
    return true;
  }
}
