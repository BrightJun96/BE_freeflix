import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DirectorController } from "./director.controller";
import { DirectorService } from "./director.service";
import { Director } from "./entities/director.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Director])],
  controllers: [DirectorController],
  providers: [DirectorService],
})
export class DirectorModule {}
