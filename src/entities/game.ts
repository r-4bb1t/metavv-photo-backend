import { File } from 'aws-sdk/clients/codecommit';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';

@Entity('game')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string; //maybe url?

  @Column('text')
  title!: string;

  @Column('text')
  standard!: string;

  @Column('text')
  tags!: string;

  @Column('int')
  password!: number;

  @Column('boolean')
  isPublic!: boolean;

  @OneToMany(() => Photo, (photo) => photo.game)
  photos!: Photo[];
}

@Entity('photo')
export class Photo {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  //   @Column('blob') //blob: Binary Large Object, 텍스트나 바이너리 데이터, 이미지로 바꿀 수 있음
  //   image!: Buffer; //MySQL의 경우 blob 칼럼 지원

  //   @Column('text') //이미지 링크만 있으면 되는 경우
  //   imgLink!: string;

  @Column('file')
  image!: File;

  @Column('int')
  score!: number;

  @ManyToOne(() => Game, (game) => game.photos)
  game!: Game;

  @OneToMany(() => Comment, (comment) => comment.photo)
  comments!: Comment[];
}

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text')
  content!: string;

  @Column('text')
  name!: string;

  @Column({ nullable: true, type: 'int' }) //아니면 Comment 엔티티 자체를 저장할 수도?
  parentCommentId!: number;

  @Column({ nullable: true, type: 'int' }) //아니면 Comment 엔티티 자체를 저장할 수도?
  childrenCommentId!: number;

  @Column('boolean')
  isCreator!: boolean;

  @Column('boolean')
  onlyCreator!: boolean;

  @ManyToOne(() => Photo, (photo) => photo.comments)
  photo!: Photo;
}