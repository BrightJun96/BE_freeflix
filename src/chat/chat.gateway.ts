import {
  UnauthorizedException,
  UseInterceptors,
} from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { QueryRunner } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { WsQueryRunner } from "../shared/decorator/ws-query-runner.decorator";
import { WsTransactionInterceptor } from "../shared/interceptor/ws-transaction.interceptor";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat.dto";

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.headers.authorization;

      if (!rawToken) {
        throw new UnauthorizedException(
          "토큰이 존재하지 않습니다.",
        );
      }

      const token =
        this.authService.parseBearerToken(rawToken);

      if (!token) client.disconnect();

      const tokenType =
        this.authService.validateTokenType(token);

      const secret =
        this.authService.getTokenSecret(tokenType);

      client.data.user =
        await this.authService.verifyBearerToken(
          token,
          secret,
        );

      const user = client.data.user;

      this.chatService.registerClient(user.sub, client);
      await this.chatService.joinUserRooms(
        user.sub,
        client,
      );
    } catch (e) {
      console.error(e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      this.chatService.removeClient(user.sub);
    }
  }

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
  @UseInterceptors(WsTransactionInterceptor)
  async sendMessage(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() client: Socket,
    @WsQueryRunner() qr: QueryRunner,
  ) {
    const payload = client.data.user;
    return this.chatService.createMessage(
      payload.sub,
      createChatDto,
      qr,
    );
    // client.emit("sendMessage", {
    //   ...data,
    //   from: "server",
    // });
  }
}
