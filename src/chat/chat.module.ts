import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { User } from "../user/entities/user.entity";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatRoom } from "./entities/chat-room.entity";
import { Chat } from "./entities/chat.entity";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ChatRoom, Chat, User]),
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
