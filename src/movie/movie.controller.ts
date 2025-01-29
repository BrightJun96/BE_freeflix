import {
  ClassSerializerInterceptor,
  Controller,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MovieService } from "./movie.service";

@Controller("movie")
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
@ApiTags("영화")
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
  ) {}

  // @Public()
  // @Get()
  // @Throttle({
  //   count: 5,
  //   unit: "minute",
  // })
  // getMovies(
  //   @Query()
  //   getMovieDto: GetMovieDto,
  //   @UserId() userId?: number,
  // ) {
  //   return this.movieService.findAll(getMovieDto, userId);
  // }
  //
  // @Public()
  // @Get("recent")
  // @ApiOperation({
  //   description: "최신 영화 조회 API",
  // })
  // getRecentMovies() {
  //   return this.movieService.findLatestMovies();
  // }
  //
  // @Public()
  // @Get(":id")
  // getMovie(
  //   @Param("id", ParseIntPipe, PositiveIntPipe)
  //   id: number,
  //   @Request() req: any,
  // ) {
  //   const session = req.session;
  //
  //   const movieCount = session.movieCount ?? {};
  //
  //   req.session.movieCount = {
  //     ...movieCount,
  //     [id]: movieCount[id] ? movieCount[id] + 1 : 1,
  //   };
  //   return this.movieService.findOne(id);
  // }
  //
  // @Post()
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  // postMovie(
  //   @Body() createMovieDto: CreateMovieDto,
  //   @QueryRunner() qr: QR,
  //   @UserId() userId: number,
  // ) {
  //   return this.movieService.create(
  //     createMovieDto,
  //     userId,
  //     qr,
  //   );
  // }
  //
  // @Patch(":id")
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  // patchMovie(
  //   @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  //   @Body() updateMovieDto: UpdateMovieDto,
  //   @QueryRunner() qr: QR,
  // ) {
  //   return this.movieService.update(id, updateMovieDto, qr);
  // }
  //
  // @Delete(":id")
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  // deleteMovie(
  //   @Param("id", ParseIntPipe, PositiveIntPipe) id: number,
  //   @QueryRunner() qr: QR,
  // ) {
  //   return this.movieService.remove(id, qr);
  // }
  //
  // // 좋아요
  // @Post(":id/like")
  // @ApiOperation({
  //   description: "좋아요 API",
  // })
  // likeMovie(
  //   @Param("id", ParseIntPipe, PositiveIntPipe)
  //   movieId: number,
  //   @UserId() userId: number,
  // ) {
  //   return this.movieService.likeMovie(movieId, userId);
  // }
  //
  // // 싫어요
  // @Post(":id/dislike")
  // @ApiOperation({
  //   description: "싫어요 API",
  // })
  // dislikeMovie(
  //   @Param("id", ParseIntPipe, PositiveIntPipe)
  //   movieId: number,
  //   @UserId() userId: number,
  // ) {
  //   return this.movieService.dislikeMovie(movieId, userId);
  // }
}
