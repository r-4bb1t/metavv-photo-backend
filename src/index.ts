import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { upload } from './upload';
import { Game, Photo, Comment } from './entities/game';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true,
  logging: false,
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.subscriber.ts'],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

const app: Application = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (req: Request, res: Response) => {
  res.send(200);
});


app.get('/game/:gameId/result', async(req: Request, res: Response) => {
  try {
    const game = await AppDataSource.getRepository(Game)
        .createQueryBuilder('game')
        .where('game.id == :id', { id: req.params.gameId})
        .andWhere('game.password == :password', { password: req.query.password})
        .leftJoinAndSelect('game.photos', 'photos')
        .getOne();

    if (!game) return res.send(404);
    
    return res.send({
        photos: game.photos.map((photo) => {
            return {
                score: photo.score,
                comment: photo.comments.map((comment) => {
                  return {
                    content: comment.content,
                    name: comment.name,
                  };
                }),
            };
        }),
    });
} catch (e) {
    console.log(e);
}
});

app.post('/upload', upload.single('image'), async (req, res) => {
  res.send({ url: (req.file as any).location });
});

app.post('/:photoId/comment', async (req: Request, res: Response) => {
  try{

    const photo = await AppDataSource.getRepository(Photo)
        .createQueryBuilder('photo')
        .where('photo.id == :id', { id: `%${req.params.photoId}%` })
        // .leftJoinAndSelect('photo.comments', 'comments')
        .getOneOrFail();

    const comment = await AppDataSource.getRepository(Comment).create(req.body as Comment)
    comment.photo = photo;
    const result = await AppDataSource.getRepository(Comment).save(comment)
    
  return res.send(comment)
  } catch (e) {
    console.log(e)
  }
});





    // const comment = await AppDataSource.getRepository(Comment)
    // .createQueryBuilder('photo')
    // .where('photo.id == id', {id: req.params.photoId})
    // .leftJoinAndSelect('photo.comment', 'comment')
    // .getOne()

        // .createQueryBuilder('comment')
        // .where('comment.id like :id', {id: `%${req.params.id}%`})
        // .andWhere ('comment.content like :content', {content: `%${req.body.content}%`})
        // .andWhere ('comment.name like :name', {name: `%${req.body.name}%`})
        // .andWhere ('comment.parentComment like :parentComment', {parentComment: `%${req.body.parentComment}%`})
        // .andWhere ('comment.childrenComment like :childrenComment', {childrenComment: `%${req.body.childrenComment}%`})
        // .andWhere ('comment.isCreator like :isCreator', {isCreator: `%${req.body.isCreator}%`})
        // .andWhere ('comment.onlyCreator like :onlyCreator', {onlyCreator: `%${req.body.isCreator}%`})

//게임 참여
app.post('/:gameId', async (req: Request, res: Response) => {
  try {
    //대충 req.body.name으로 유저 찾기

    const game = await AppDataSource.getRepository(Game)
      .createQueryBuilder('game')
      .where('game.id = :gameId', { gameId: req.params.gameId })
      .leftJoinAndSelect('game.photos', 'photos')
      .getOne();
    if (!game) return res.send(404);
    if (game.photos.length) for (let i = 0; i < game.photos.length; i++) {}
  } catch (e) {
    console.log(e);
  }
});

const PORT = 4000;

try {
  app.listen(PORT, (): void => {
    console.log(`Connected successfully on port ${PORT}`);
  });
} catch (error: any) {
  console.error(`Error occured: ${error.message}`);
}

app.post('/new', async (req: Request, res: Response) => {
  try {
    const game = await AppDataSource.getRepository(Game).create({
      title: req.body.title,
      standard: req.body.standard,
      isPublic: req.body.isPublic,
      tags: req.body.tags,
      password: req.body.password,
      photos: req.body.photos
    });
    const result = await AppDataSource.getRepository(Game).save(game);

    return res.send(result);
  } catch (e) {
    console.log(e);
  }
});