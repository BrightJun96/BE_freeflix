import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { ChatService } from "./chat.service";

@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage("receiveMessage")
  async receiveMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log("receiveMessage");
    console.log("data :", data);
    console.log("client :", client);
  }

  @SubscribeMessage("sendMessage")
  async sendMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.emit("sendMessage", {
      ...data,
      from: "server",
    });
  }
}
