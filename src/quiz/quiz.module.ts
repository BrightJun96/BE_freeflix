import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MultipleChoice } from "./entities/multiple-choice.entity";
import { QuizMetaData } from "./entities/quiz-meta-data.entity";
import { Quiz } from "./entities/quiz.entity";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      QuizMetaData,
      MultipleChoice,
    ]),
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
