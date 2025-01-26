import * as ffmpeg from "@ffmpeg-installer/ffmpeg";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";
import * as session from "express-session";
import * as ffprobe from "ffprobe-static";
import * as ffmpegFluent from "fluent-ffmpeg";
import { AppModule } from "./app.module";

ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "https://thedevlounge.com",
      "http://localhost:3000",
    ],
    credentials: true,
    //PROD
    // origin: * ,//PROD
  });

  const config = new DocumentBuilder()
    .setTitle("Dev-Lounge API")
    .setDescription("Dev-Lounge API 문서")
    .setVersion("1.0")
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup("doc", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 요청에 없는 속성은 제거
      forbidNonWhitelisted: true, // whitelist에 없는 속성이 있으면 에러

      transformOptions: {
        enableImplicitConversion: true, // ts에 정의된 타입으로 자동 변환
      },
    }),
  );

  app.use(session({ secret: process.env.SESSION_SECRET }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
