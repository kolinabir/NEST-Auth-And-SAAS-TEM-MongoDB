import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env'],
    }),

    // Logger
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('app.nodeEnv') === 'production';
        return {
          pinoHttp: {
            // Fix for pino-pretty transport configuration
            transport: isProduction 
              ? undefined 
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                  }
                },
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
    }),

    // Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        // Removed deprecated options
        ...configService.get('database.options'),
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
