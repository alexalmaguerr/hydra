import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Global validation pipe — rejects unknown fields and validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = process.env.PORT ?? 3001;

  // T17: Separate CORS origins for internal app and customer portal.
  // Set CORS_INTERNAL_ORIGIN for the backoffice and CORS_PORTAL_ORIGIN for the portal.
  // CORS_ORIGIN is the legacy fallback for single-origin deployments.
  const internalOrigin = process.env.CORS_INTERNAL_ORIGIN;
  const portalOrigin = process.env.CORS_PORTAL_ORIGIN;
  const legacyOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8080';

  const allowedOrigins: string[] = [
    ...(internalOrigin ? [internalOrigin] : []),
    ...(portalOrigin ? [portalOrigin] : []),
    ...(!internalOrigin && !portalOrigin ? [legacyOrigin] : []),
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.listen(port, '0.0.0.0');
  console.log(`API running at http://0.0.0.0:${port} — allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
