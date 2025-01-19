import { Controller, Get } from "@nestjs/common";
import { SharedService } from "./shared.service";

@Controller("shared")
export class SharedController {
  constructor(
    private readonly sharedService: SharedService,
  ) {}

  @Get("presigned-url")
  async createPresignedURL() {
    return {
      url: await this.sharedService.createPresignedURL(),
    };
  }
}
