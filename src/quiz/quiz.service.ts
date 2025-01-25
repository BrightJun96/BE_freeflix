import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMultipleChoiceDto } from "./dto/create-multiple-choice.dto";
import { CreateQuizMetaDataDto } from "./dto/create-quiz-meta-data.dto";
import { CreateQuizDto } from "./dto/create-quiz.dto";
import { UpdateQuizDto } from "./dto/update-quiz.dto";
import { MultipleChoice } from "./entities/multiple-choice.entity";
import { QuizMetaData } from "./entities/quiz-meta-data.entity";
import { Quiz } from "./entities/quiz.entity";

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizMetaData)
    private readonly quizMetaDataRepository: Repository<QuizMetaData>,
    @InjectRepository(MultipleChoice)
    private readonly multipleChoiceRepository: Repository<MultipleChoice>,
  ) {}

  async create(createQuizDto: CreateQuizDto) {
    const quizMetaData = await this.createQuizMetaData(
      createQuizDto.quizMetaData,
    );

    const quiz = await this.quizRepository.save({
      title: createQuizDto.title,
      content: createQuizDto.content,
      explanation: createQuizDto.explanation,
      detailUrl: createQuizDto.detailUrl,
      field: createQuizDto.field,
      answer: createQuizDto.answer,
      quizMetaData: {
        id: quizMetaData.id,
      },
    });

    const multipleChoices =
      await this.createMultipleChoices(
        createQuizDto.multipleChoices,
        quiz.id,
      );

    return { ...quiz, multipleChoices };
  }

  async createQuizMetaData(
    metaData: CreateQuizMetaDataDto,
  ) {
    return await this.quizMetaDataRepository.save(metaData);
  }

  async createMultipleChoices(
    multipleChoicesDto: CreateMultipleChoiceDto[],
    quizId: number,
  ) {
    // 각 DTO에 quiz 관계 추가
    const choicesWithQuiz = multipleChoicesDto.map(
      (choice) => ({
        ...choice,
        quiz: { id: quizId }, // 퀴즈 ID 설정
      }),
    );

    return await this.multipleChoiceRepository.save(
      choicesWithQuiz,
    );
  }

  findAll() {
    return `This action returns all quiz`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quiz`;
  }

  update(id: number, updateQuizDto: UpdateQuizDto) {
    return `This action updates a #${id} quiz`;
  }

  remove(id: number) {
    return `This action removes a #${id} quiz`;
  }
}
