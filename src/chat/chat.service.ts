import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WsException } from "@nestjs/websockets";
import { plainToClass } from "class-transformer";
import { Socket } from "socket.io";
import { QueryRunner, Repository } from "typeorm";
import { Role, User } from "../user/entities/user.entity";
import { CreateChatDto } from "./dto/create-chat.dto";
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  // 메시지 전송
  async createMessage(
    userId: number,
    { room, message }: CreateChatDto,
    qr: QueryRunner,
  ) {
    const user = await qr.manager.findOne(User, {
      where: {
        id: userId,
      },
    });

    const chatRoom = await this.getChatRoom(user, qr, room);

    const msgModel = await qr.manager.save(Chat, {
      author: user,
      message,
      chatRoom,
    });

    console.log("msgModel :", msgModel);
    const client = this.connectedClients.get(user.id);

    client
      .to(chatRoom.id.toString())
      .emit("newMessage", plainToClass(Chat, msgModel));

    return message;
  }

  // 채팅방 조회
  async getChatRoom(
    user: User,
    qr: QueryRunner,
    room?: number,
  ) {
    if (user.role === Role.admin) {
      if (room) {
        throw new WsException(
          "ADMIN은 ROOMID를 필수적으로 제공해야합니다.",
        );
      }

      return await qr.manager.findOne(ChatRoom, {
        where: {
          id: room,
        },
        relations: ["users"],
      });
    }

    const chatRoom = await qr.manager
      .createQueryBuilder(ChatRoom, "chatRoom")
      .innerJoin("chatRoom.users", "user")
      .where("user.id= :userId", {
        userId: user.id,
      })
      .getOne();

    return (
      chatRoom ?? (await this.createChatRoom(user, qr))
    );
  }

  // 채팅방 생성
  async createChatRoom(user: User, qr: QueryRunner) {
    const adminUser = await qr.manager.findOne(User, {
      where: {
        role: Role.admin,
      },
    });

    const chatRoom = await this.chatRoomRepository.save({
      users: [user, adminUser],
    });

    [user.id, adminUser.id].forEach((userId) => {
      const client = this.connectedClients.get(userId);

      if (client) {
        client.emit("roomCreated", chatRoom.id);
        client.join(chatRoom.id.toString());
      }
    });

    return chatRoom;
  }
}
