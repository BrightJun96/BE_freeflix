import { Module } from "@nestjs/common";
import { SharedService } from "./shared.service";
import { TasksService } from "./tasks.service";

@Module({
  imports: [],
  controllers: [],
  providers: [SharedService, TasksService],
  exports: [SharedService],
})
export class SharedModule {}
