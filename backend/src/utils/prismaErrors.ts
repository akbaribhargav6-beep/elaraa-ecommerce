import { Prisma } from '@prisma/client';

// Prisma surfaces FK-constraint violations two different ways depending on
// whether its own query engine catches it (PrismaClientKnownRequestError,
// code P2003) or whether it reaches the database first and Postgres rejects
// it (PrismaClientUnknownRequestError wrapping a raw Postgres error, code
// 23503/23001). Both mean the same thing to callers: "this row is
// referenced elsewhere and can't be deleted" — check for both.
export function isForeignKeyConstraintError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') return true;
  if (
    err instanceof Prisma.PrismaClientUnknownRequestError &&
    /23503|23001|foreign key constraint|violates.*RESTRICT/i.test(err.message)
  ) {
    return true;
  }
  return false;
}
