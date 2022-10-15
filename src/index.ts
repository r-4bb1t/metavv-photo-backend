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

app.get('/:gameId', async (req: Request, res: Response) => {
  const game = await AppDataSource.getRepository(Game)
    .createQueryBuilder('game')
    .where('game.id = :gameId', { gameId: req.params.gameId })
    .leftJoinAndSelect('game.photos', 'photos')
    .leftJoinAndSelect('photos.comments', 'comments')
    .getOne();

  if (!game) return res.send(404);

  return res.json(game);
});

app.post('/new', upload.array('files'), async (req: Request, res: Response) => {
  try {
    const game = await AppDataSource.getRepository(Game).create({
      title: req.body.title,
      standard: req.body.standard,
      isPublic: req.body.isPublic,
      tags: req.body.tags,
      password: req.body.password,
      photos: [],
    });
    const result = await AppDataSource.getRepository(Game).save(game);

    const urls = (req.files as Express.MulterS3.File[])?.map((file) => file.location);

    await Promise.all(
      urls.map(async (url: string) => {
        const p = await AppDataSource.getRepository(Photo).create({
          game: result,
          img: url,
          score: 0,
          comments: [],
        });
        await AppDataSource.getRepository(Photo).save(p);
      }),
    );

    return res.send({ url: result.id });
  } catch (e) {
    console.log(e);
    return res.send(400).json({ message: e });
  }
});

app.get('/:gameId/result', async (req: Request, res: Response) => {
  try {
    const game = await AppDataSource.getRepository(Game)
      .createQueryBuilder('game')
      .where('game.id = :id', { id: req.params.gameId })
      .andWhere('game.password = :password', { password: req.query.password })
      .leftJoinAndSelect('game.photos', 'photos')
      .leftJoinAndSelect('photos.comments', 'comments')
      .getOne();

    if (!game) return res.send(404);

    return res.send({
      photos: game.photos.map((photo) => {
        return {
          id: photo.id,
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

app.post('/:photoId/comment', async (req: Request, res: Response) => {
  try {
    const photo = await AppDataSource.getRepository(Photo)
      .createQueryBuilder('photo')
      .where('photo.id = :id', { id: req.params.photoId })
      // .leftJoinAndSelect('photo.comments', 'comments')
      .getOneOrFail();

    const comment = await AppDataSource.getRepository(Comment).create(req.body as Comment);
    comment.photo = photo;
    const result = await AppDataSource.getRepository(Comment).save(comment);

    return res.send(result);
  } catch (e) {
    console.log(e);
  }
});

//게임 참여
app.post('/:gameId', async (req: Request, res: Response) => {
  try {
    const game = await AppDataSource.getRepository(Game)
      .createQueryBuilder('game')
      .where('game.id = :gameId', { gameId: req.params.gameId })
      .leftJoinAndSelect('game.photos', 'photos')
      .leftJoinAndSelect('photos.comments', 'comments')
      .getOne();

    if (!game) return res.send(404);

    await Promise.all(
      Object.keys(req.body.photos).map(async (photoId) => {
        try {
          const photo = await AppDataSource.getRepository(Photo)
            .createQueryBuilder('photo')
            .where('photo.id = :photoId', { photoId })
            .getOneOrFail();
          photo.score += req.body.photos[photoId];
          await AppDataSource.getRepository(Photo).save(photo);
        } catch {
          return null;
        }
      }),
    );

    return res.send({
      photos: game.photos.map((photo) => {
        return {
          id: photo.id,
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

const PORT = 4000;

try {
  app.listen(PORT, (): void => {
    console.log(`Connected successfully on port ${PORT}`);
  });
} catch (error: any) {
  console.error(`Error occured: ${error.message}`);
}
