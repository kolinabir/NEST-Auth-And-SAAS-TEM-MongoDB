import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminActivityService } from './services/admin-activity.service';
import { AdminActivityInterceptor } from './interceptors/admin-activity.interceptor';
import { AdminActivity, AdminActivitySchema } from './entities/admin-activity.entity';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: AdminActivity.name, schema: AdminActivitySchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminActivityService,
    AdminActivityInterceptor,
  ],
  exports: [AdminService, AdminActivityService],
})
export class AdminModule {}
