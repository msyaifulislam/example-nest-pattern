import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from '../member/member.module';
import { Point } from './entities/point.entity';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { PointUseCase } from './use-cases/point.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Point]), forwardRef(() => MemberModule)],
  controllers: [PointController],
  providers: [PointService, PointUseCase],
  exports: [PointService]
})
export class PointModule { }
