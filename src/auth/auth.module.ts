import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffGuard } from './guards/staff.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    NotificationsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, StaffGuard],
  exports: [AuthService, JwtModule, StaffGuard],
})
export class AuthModule {}
