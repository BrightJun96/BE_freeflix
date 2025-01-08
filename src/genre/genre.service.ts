import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateGenreDto } from "./dto/create-genre.dto";
import { UpdateGenreDto } from "./dto/update-genre.dto";
import { Genre } from "./entities/genre.entity";

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto) {
    // const duplicateOne = await this.genreRepository.findOne(
    //   {
    //     where: {
    //       name: createGenreDto.name,
    //     },
    //   },
    // );

    // if (duplicateOne) {
    //   throw new BadRequestException(
    //     "이미 존재하는 장르입니다.",
    //   );
    // }

    return await this.genreRepository.save(createGenreDto);
  }

  async findAll() {
    return await this.genreRepository.find();
  }

  async findOne(id: number) {
    const genre = await this.genreRepository.findOne({
      where: { id },
    });

    if (!genre) {
      throw new NotFoundException(
        "존재하지 않는 장르입니다.",
      );
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.findOne(id);

    await this.genreRepository.update(
      genre.id,
      updateGenreDto,
    );

    return await this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.genreRepository.delete(id);

    return id;
  }
}
