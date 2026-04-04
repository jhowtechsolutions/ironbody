import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingPlanType } from '@prisma/client';
import { AiService } from './ai.service';
import { GenerateWorkoutDto } from './dto/generate-workout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PremiumGuard } from '../common/guards/premium.guard';
import { PlanTypeGuard } from '../common/guards/plan-type.guard';
import { RequirePlanType } from '../common/decorators/require-plan-type.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PremiumGuard, PlanTypeGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('workout/generate')
  @Roles('PERSONAL_PROFESSOR')
  @RequirePlanType(BillingPlanType.PERSONAL)
  @ApiOperation({ summary: 'Gerar treino com IA (Personal Premium)' })
  async generateWorkout(
    @Body() dto: GenerateWorkoutDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ai.generateWorkout(dto, user.id);
  }

  @Post('nutrition/meal-photo')
  @Roles('ALUNO')
  @RequirePlanType(BillingPlanType.ALUNO)
  @ApiOperation({
    summary: 'Análise de foto de refeição (Aluno Premium) — placeholder',
  })
  async mealPhotoPlaceholder(@CurrentUser() user: { id: string }) {
    return this.ai.mealPhotoPlaceholder(user.id);
  }
}
