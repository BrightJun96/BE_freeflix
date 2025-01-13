import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { envVariablesKeys } from "../shared/const/env.const";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException(
        "이미 존재하는 이메일입니다.",
      );
    }

    // 해싱 암호화
    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(
        envVariablesKeys.HASH_ROUNDS,
      ),
    );

    // 해싱된 암호로 저장
    await this.userRepository.save({
      email,
      password: hash,
    });

    return await this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException(
        "존재하지 않는 사용자입니다.",
      );
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    const hashedPassword = await bcrypt.hash(
      updateUserDto.password,
      this.configService.get<number>(
        envVariablesKeys.HASH_ROUNDS,
      ),
    );

    await this.userRepository.update(user.id, {
      ...updateUserDto,
      password: hashedPassword,
    });

    return await this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException(
        "존재하지 않는 사용자입니다.",
      );
    }

    await this.userRepository.delete(id);
    return id;
  }
}
