import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class TasksService {
  constructor() {}

  @Cron("* * * * * *")
  taskScheduler() {
    console.log("1초마다 실행되는 스케줄러입니다.");
  }
}
