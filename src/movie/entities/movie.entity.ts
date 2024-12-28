import { Exclude } from "class-transformer";

export class Movie {
  id: number;
  title: string;
  @Exclude()
  genre: string;
}
