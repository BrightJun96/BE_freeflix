import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { UpdateDirectorDto } from "./dto/update-director.dto";
import { Director } from "./entities/director.entity";

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private directorRepository: Repository<Director>,
  ) {}

  async create(createDirectorDto: CreateDirectorDto) {
    return await this.directorRepository.save(
      createDirectorDto,
    );
  }

  async findAll() {
    return await this.directorRepository.find();
  }

  async findOne(id: number) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    return director;
  }

  async update(
    id: number,
    updateDirectorDto: UpdateDirectorDto,
  ) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    await this.directorRepository.update(
      id,
      updateDirectorDto,
    );

    return await this.directorRepository.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: number) {
    const director = await this.directorRepository.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException(
        "존재하지 않는 감독입니다.",
      );
    }

    await this.directorRepository.delete(id);

    return director;
  }
}
