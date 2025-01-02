import { CreateDateColumn, VersionColumn } from "typeorm";

// 모든 엔티티에 공통적으로 사용되는 필드를 BaseEntity 클래스에 정의
export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
