import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { Role } from "../../user/entities/user.entity";
import { RBAC } from "../decorator/rbac.decorator";

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const role = this.reflector.get<Role>(
      RBAC,
      context.getHandler(),
    );
    // if (!role) return true;

    // 데코레이터 존재 여부 확인
    // 데코레이터 값이 ROLE Enum에 존재하는지 확인
    // 권한 자체 할당 안하면 그냥 패스바이

    if (!Object.values(Role).includes(role)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    // AuthGuard 통과했는지 확인
    if (!user) return false;

    return user.role <= role;
  }
}
