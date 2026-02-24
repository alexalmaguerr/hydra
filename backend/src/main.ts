import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3001;
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8080';
  app.enableCors({ origin: corsOrigin, credentials: true });
  await app.listen(port, '0.0.0.0');
  console.log(`API running at http://0.0.0.0:${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
