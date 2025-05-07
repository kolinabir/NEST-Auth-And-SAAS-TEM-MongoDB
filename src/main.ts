import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as passport from 'passport';
import { setupSwagger } from './config/swagger.config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // Create the NestJS application with rawBody support for webhooks
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false, // Disable built-in bodyParser to use custom one
  });

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const isProduction = process.env.NODE_ENV === 'production';

  // Configure body parser with raw body support for webhooks
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        if (req.url.startsWith('/payments/webhook')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Parse URL-encoded data
  app.use(bodyParser.urlencoded({ extended: true }));

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Enable CORS with credentials
  app.enableCors({
    origin: configService.get('app.frontendUrl'),
    credentials: true,
  });

  // Add cookie parser middleware
  app.use(cookieParser());

  // Setup session
  app.use(
    session({
      secret: configService.get<string>('app.jwt.accessTokenSecret'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction, // Only use secure cookies in production
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: isProduction ? 'none' : 'lax',
      },
    }),
  );

  // Initialize Passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up Swagger documentation
  setupSwagger(app);

  // Start the application
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
