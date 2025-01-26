import { PartialType } from "@nestjs/mapped-types";
import { CreateQuizMetaDataDtoRequest } from "./create-quiz-meta-data.dto.request";

export class UpdateQuizMetaDataDto extends PartialType(
  CreateQuizMetaDataDtoRequest,
) {}
