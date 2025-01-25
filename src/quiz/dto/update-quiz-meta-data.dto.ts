import { PartialType } from "@nestjs/mapped-types";
import { CreateQuizMetaDataDto } from "./create-quiz-meta-data.dto";

export class UpdateQuizMetaDataDto extends PartialType(
  CreateQuizMetaDataDto,
) {}
