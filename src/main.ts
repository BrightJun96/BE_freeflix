import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 요청에 없는 속성은 제거
      forbidNonWhitelisted: true, // whitelist에 없는 속성이 있으면 에러
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
