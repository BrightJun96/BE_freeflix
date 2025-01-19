import { Exclude } from "class-transformer";
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ChatRoom } from "../../chat/entities/chat-room.entity";
import { Chat } from "../../chat/entities/chat.entity";
import { MovieUserLike } from "../../movie/entities/movie-user-like.entity";
import { Movie } from "../../movie/entities/movie.entity";
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
  @Exclude({
    toPlainOnly: true, // 응답할 때 제외
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @OneToMany(() => Movie, (movie) => movie.creator)
  createdMovies: Movie[];

  @OneToMany(() => MovieUserLike, (mul) => mul.user)
  likedUsers: MovieUserLike[];

  @OneToMany(() => Chat, (chat) => chat.author)
  chats: Chat[];

  @ManyToMany(() => ChatRoom, (chatRoom) => chatRoom.users)
  chatRooms: ChatRoom[];
}
