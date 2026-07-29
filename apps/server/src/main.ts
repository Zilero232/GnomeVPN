import type { NestExpressApplication } from '@nestjs/platform-express';

import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from './app.module';
import { allowedOrigins } from './config/cors';
import { validateEnv } from './config/env.schema';

import 'reflect-metadata';

const env = validateEnv(process.env);

const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['set-auth-token', 'content-disposition']
});
app.use(json());
app.useGlobalPipes(new ZodValidationPipe());
app.enableShutdownHooks();

await app.listen(env.PORT);
