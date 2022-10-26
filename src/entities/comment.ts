import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Photo } from './photo';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column('text')
  content!: string;

  @Column('text')
  name!: string;

  @ManyToOne(() => Comment, (comment) => comment.childrenComment)
  parentComment: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  childrenComment: Comment[];

  @Column('boolean')
  isCreator!: boolean;

  @Column('boolean')
  onlyCreator!: boolean;

  @ManyToOne(() => Photo, (photo) => photo.comments)
  photo!: Photo;
}
