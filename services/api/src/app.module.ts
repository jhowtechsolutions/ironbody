import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SportsModule } from './sports/sports.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { InvitationsModule } from './invitations/invitations.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    SportsModule,
    WorkoutsModule,
    StudentsModule,
    AiModule,
    BillingModule,
    AssessmentsModule,
    MediaModule,
    InvitationsModule,
  ],
})
export class AppModule {}
