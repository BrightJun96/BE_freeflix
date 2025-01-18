import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("freeflix API")
    .setDescription("freeflix API 문서")
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
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
