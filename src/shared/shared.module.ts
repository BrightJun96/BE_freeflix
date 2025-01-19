import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "../movie/entities/movie.entity";
import { SharedController } from "./shared.controller";
import { SharedService } from "./shared.service";
import { TasksService } from "./tasks.service";

@Module({
  imports: [TypeOrmModule.forFeature([Movie])],
  controllers: [SharedController],
  providers: [SharedService, TasksService],
  exports: [SharedService],
})
export class SharedModule {}
