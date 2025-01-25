import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseTable } from "../../shared/entity/base-table";
import { MultipleChoice } from "./multiple-choice.entity";
import { QuizMetaData } from "./quiz-meta-data.entity";

export enum Field {
  FrontEnd = "FRONTEND",
  BackEnd = "BACKEND",
  Database = "DATABASE",
}

@Entity({
  comment: "퀴즈",
})
export class Quiz extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: "퀴즈 제목",
  })
  title: string;

  @Column({
    comment: "퀴즈 내용",
  })
  content: string;

  @Column({
    comment: "퀴즈 해설",
  })
  explanation: string;

  @Column({
    comment: "퀴즈 URL-프론트에서 접근하기 위한 상세 경로",
    unique: true,
  })
  detailUrl: string;

  @Column({
    enum: Field,
    comment: "퀴즈 분야",
  })
  field: Field;

  @Column({
    comment: "정답",
  })
  answer: number;

  @OneToOne(
    () => QuizMetaData,
    (quizMetaData) => quizMetaData.id,
    {
      cascade: true,
    },
  )
  @JoinColumn()
  quizMetaData: QuizMetaData;

  @OneToMany(
    () => MultipleChoice,
    (multipleChoice) => multipleChoice.quiz,
    {
      cascade: true,
    },
  )
  multipleChoices: MultipleChoice[];
}
