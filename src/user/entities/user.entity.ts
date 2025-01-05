import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BaseTable } from "../../shared/entity/base-table";

export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;
}
