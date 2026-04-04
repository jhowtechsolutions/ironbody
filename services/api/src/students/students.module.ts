import { Module } from '@nestjs/common';
import { WorkoutsModule } from '../workouts/workouts.module';
import { StudentsController } from './students.controller';

@Module({
  imports: [WorkoutsModule],
  controllers: [StudentsController],
})
export class StudentsModule {}
