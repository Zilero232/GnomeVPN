import { Prisma } from '../../../../generated';

export type PrismaRequestError = Prisma.PrismaClientKnownRequestError;

export const isPrismaRequestError = (error: unknown): error is PrismaRequestError => error instanceof Prisma.PrismaClientKnownRequestError;
