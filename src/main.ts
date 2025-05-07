import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Enable CORS
  app.enableCors();

  // Start the application
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
