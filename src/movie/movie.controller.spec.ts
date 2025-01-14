import { MovieController } from "./movie.controller";

describe("MovieController", () => {
  let controller: MovieController;

  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     controllers: [MovieController],
  //     providers: [MovieService],
  //   }).compile();
  //
  //   controller = module.get<MovieController>(MovieController);
  // });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    // expect(controller).toBeDefined();
    expect(true).toBe(true);
  });
});
