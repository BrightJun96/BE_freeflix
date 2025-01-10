import { Injectable } from "@nestjs/common";

@Injectable()
export class FileUploadService {
  create(fileName: string) {
    return "This action adds a new file";
  }
}
