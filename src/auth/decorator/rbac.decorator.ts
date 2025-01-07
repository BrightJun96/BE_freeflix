import { Reflector } from "@nestjs/core";
import { Role } from "../../user/entities/user.entity";

export const RBAC = Reflector.createDecorator<Role>();
