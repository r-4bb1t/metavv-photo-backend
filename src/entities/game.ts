import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from './photo';

@Entity('game')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string; //maybe url?

  @Column('text')
  title!: string;

  @Column('text')
  standard!: string;

  @Column('simple-array')
  tags: string[];

  @Column('int')
  password!: number;

  @Column('boolean')
  isPublic!: boolean;

  @OneToMany(() => Photo, (photo) => photo.game)
  photos!: Photo[];
}
