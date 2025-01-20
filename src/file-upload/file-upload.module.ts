import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import e from "express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { MIME_TYPE } from "../movie/constant/mime-type";
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
        host: "redis-19000.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com",
        port: 19000,
        username: "default",
        password: "kHosdhpR9r5inhZxOoBzyhx6Q5Ky0EH5",
      },
    }),
    BullModule.registerQueue({
      name: "thumbnail-generation",
    }),
  ],
})
export class FileUploadModule {}
