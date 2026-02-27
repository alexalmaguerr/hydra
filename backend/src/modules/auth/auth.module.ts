import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { LdapStrategy } from './ldap.strategy';
import { InternalGuard } from './internal.guard';
import { PortalGuard } from './portal.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LdapStrategy, RolesGuard, InternalGuard, PortalGuard],
  exports: [AuthService, JwtModule, RolesGuard, InternalGuard, PortalGuard],
})
export class AuthModule {}
