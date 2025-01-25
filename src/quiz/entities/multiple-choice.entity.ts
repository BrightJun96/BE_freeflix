import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Quiz } from "./quiz.entity";

@Entity({
  comment: "퀴즈 객관식 문제",
})
export class MultipleChoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: "문제 내용",
  })
  content: string;

  @Column({
    comment: "문제 번호",
  })
  order: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.id)
  quiz: Quiz;
}
