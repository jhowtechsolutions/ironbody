import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SportsService } from './sports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sports')
export class SportsController {
  constructor(private sports: SportsService) {}

  @Get()
  findAll() {
    return this.sports.findAll();
  }

  @Get(':sportId/categories')
  findCategories(@Param('sportId') sportId: string) {
    return this.sports.findCategories(sportId);
  }

  @Get(':sportId/exercises')
  findExercises(@Param('sportId') sportId: string) {
    return this.sports.findExercises(sportId);
  }
}
