import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Comment } from './comment';
import { Game } from './game';

@Entity('photo')
export class Photo {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text')
  img!: string;

  @Column('int')
  score!: number;

  @ManyToOne(() => Game, (game) => game.photos)
  game!: Game;

  @OneToMany(() => Comment, (comment) => comment.photo)
  comments!: Comment[];
}
