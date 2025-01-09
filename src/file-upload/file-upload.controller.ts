import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MIME_TYPE } from "../movie/constant/mime-type";
import { FileUploadService } from "./file-upload.service";

@Controller("file-upload")
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 30000000, // 30MB
      },
      fileFilter(
        req: any,
        file: {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          size: number;
          destination: string;
          filename: string;
          path: string;
          buffer: Buffer;
        },
        callback: (
          error: Error | null,
          acceptFile: boolean,
        ) => void,
      ) {
        if (file.mimetype !== MIME_TYPE.MP4) {
          return callback(
            new BadRequestException(
              "mp4 파일만 업로드 가능합니다.",
            ),
            false,
          );
        }
        return callback(null, true);
      },
    }),
  )
  create(@UploadedFile() file: Express.Multer.File) {
    return {
      fileName: file.filename,
    };
  }
}
