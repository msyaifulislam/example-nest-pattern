import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberLog } from './entities/member-log.entity';
import { MemberLoyalty } from './entities/member-loyalty.entity';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberUseCase } from './use-cases/member.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberLog, MemberLoyalty])],
  controllers: [MemberController],
  providers: [MemberService, MemberUseCase]
})
export class MemberModule { }
