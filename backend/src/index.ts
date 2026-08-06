import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/db';

const server = app.listen(env.PORT, () => {
  console.log(`✓ ELARAA API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
