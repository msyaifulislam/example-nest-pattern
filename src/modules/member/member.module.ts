import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointModule } from '../point/point.module';
import { MemberLog } from './entities/member-log.entity';
import { MemberLoyalty } from './entities/member-loyalty.entity';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberUseCase } from './use-cases/member.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberLog, MemberLoyalty]), forwardRef(() => PointModule)],
  controllers: [MemberController],
  providers: [MemberService, MemberUseCase],
  exports: [MemberService]
})
export class MemberModule { }
