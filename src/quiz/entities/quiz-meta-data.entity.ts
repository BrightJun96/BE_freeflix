import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Quiz } from "./quiz.entity";

@Entity({
  comment: "퀴즈 메타데이터",
})
export class QuizMetaData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: "퀴즈 제목-프론트 title 태그에 사용",
  })
  seoMetaTitle: string;

  @Column({
    comment: "퀴즈 제목-프론트 description 태그에 사용",
  })
  seoMetaDescription: string;

  @Column({
    comment: "퀴즈 제목-프론트 imageUrl에 사용",
    nullable: true,
  })
  metaImageUrl: string;

  @OneToOne(() => Quiz, (quiz) => quiz.id, {
    onDelete: "CASCADE",
  })
  quiz: Quiz;
}
