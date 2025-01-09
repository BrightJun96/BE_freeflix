import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../auth/decorator/public.decorator";
import { RBAC } from "../auth/decorator/rbac.decorator";
import { TransactionInterceptor } from "../shared/interceptor/transaction.interceptor";
import { PositiveIntPipe } from "../shared/pipe/positive-int.pipe";
import { Role } from "../user/entities/user.entity";
import { MIME_TYPE } from "./constant/mime-type";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { GetMovieDto } from "./dto/get-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { MovieService } from "./movie.service";

@Controller("movie")
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  @Public()
  @Get()
  getMovies(
    @Query()
    getMovieDto: GetMovieDto,
  ) {
    return this.movieService.findAll(getMovieDto);
  }

  @Public()
  @Get(":id")
  getMovie(
    @Param(
      "id",
      new ParseIntPipe({
        exceptionFactory() {
          throw new BadRequestException(
            "숫자만 입력해주세요.",
          );
        },
      }),
      PositiveIntPipe,
    )
    id: number,
  ) {
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(
    FileInterceptor("movie", {
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
  ) // 파일 업로드[키값 설정]
  postMovie(
    @Body() createMovieDto: CreateMovieDto,
    @Request() req,
    @UploadedFile() movie: Express.Multer.File,
  ) {
    return this.movieService.create(
      createMovieDto,
      movie.filename,
      req.queryRunner,
    );
  }

  @Patch(":id")
  @RBAC(Role.admin)
  patchMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.movieService.update(
      Number(id),
      updateMovieDto,
    );
  }

  @Delete(":id")
  // @RBAC(Role.admin)
  deleteMovie(
    @Param("id", ParseIntPipe, PositiveIntPipe) id: string,
  ) {
    return this.movieService.remove(Number(id));
  }
}
