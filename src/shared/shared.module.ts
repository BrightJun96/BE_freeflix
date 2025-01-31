import { Module } from "@nestjs/common";
import { SharedController } from "./shared.controller";
import { SharedService } from "./shared.service";
import { TasksService } from "./tasks.service";

@Module({
  controllers: [SharedController],
  providers: [SharedService, TasksService],
  exports: [SharedService],
})
export class SharedModule {}
