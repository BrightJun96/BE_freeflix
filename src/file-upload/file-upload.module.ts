import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import e from "express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { MIME_TYPE } from "./constant/mime-type";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService],
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), "public", "temp"),
        filename(
          req: e.Request,
          file: Express.Multer.File,
          callback: (
            error: Error | null,
            filename: string,
          ) => void,
        ) {
          const split = file.originalname.split(".");

          let extension = MIME_TYPE.MP4;

          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          callback(
            null,
            `${v4()}-${Date.now()}.${extension}`,
          );
        },
      }),
    }),
    BullModule.forRoot({
      connection: {
        username: "default",
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: "thumbnail-generation",
    }),
  ],
})
export class FileUploadModule {}
