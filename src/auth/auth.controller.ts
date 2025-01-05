import {
  ClassSerializerInterceptor,
  Controller,
  Headers,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  registerUser(@Headers("authorization") token: string) {
    return this.authService.register(token);
  }

  @Post("login")
  loginUser(@Headers("authorization") token: string) {
    return this.authService.login(token);
  }
}
