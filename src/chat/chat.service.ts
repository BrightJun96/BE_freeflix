import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Socket } from "socket.io";
import { Repository } from "typeorm";
import { ChatRoom } from "./entities/chat-room.entity";
import { Chat } from "./entities/chat.entity";

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<
    number,
    Socket
  >();

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
  ) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(userId: number, client: Socket) {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder("chatRooms")
      .innerJoin(
        "chatRooms.users",
        "user",
        "user.id= :userId",
        {
          userId,
        },
      )
      .getMany();

    chatRooms.forEach((room) => {
      client.join(room.id.toString());
    });
  }
}
