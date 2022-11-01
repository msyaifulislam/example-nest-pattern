import { BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MemberLog } from './entities/member-log.entity';
import { MemberLoyalty } from './entities/member-loyalty.entity';
import { Member } from './entities/member.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MemberEventEnum } from 'src/core/events/member/member-event.enum';
import { StoreMemberLogEvent } from '../../core/events/member/member-event.interface';
import { PointService } from '../point/point.service';
import { Point } from '../point/entities/point.entity';
import { } from 'nest-winston';
import { AuditServiceLogCtx, IAuditServiceLog } from 'src/core/constants/audit-log.constant';
import { RequestContext } from '@medibloc/nestjs-request-context';
import { InsertAuditServiceResponseCtx } from 'src/core/helpers/insert-ctx.helper';
import { IAuditLog } from 'src/core/interfaces/audit-log.interface';
@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name)
  constructor(
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(MemberLoyalty)
    private readonly memberLoyaltyRepo: Repository<MemberLoyalty>,
    @InjectRepository(MemberLog)
    private readonly memberLogRepo: Repository<MemberLog>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => PointService))
    private readonly pointService: PointService
  ) { }

  async findOneMemberByAttribute(option: FindOneOptions<Member>): Promise<Member> {
    return await this.memberRepo.findOne(option)
  }

  async findMemberByAttribute(option: FindManyOptions<Member>): Promise<Member[]> {
    return await this.memberRepo.find(option)
  }

  async findOneMemberLoyaltyByAttribute(option: FindOneOptions<MemberLoyalty>): Promise<MemberLoyalty> {
    return await this.memberLoyaltyRepo.findOne(option)
  }

  async findMemberLogByAttribute(option: FindManyOptions<MemberLog>): Promise<MemberLog[]> {
    return await this.memberLogRepo.find(option)
  }

  async createMember(input: Member): Promise<{ member: Member, loyalty: MemberLoyalty }> {
    const validate = await this.findOneMemberByAttribute({
      where: [
        {
          phoneNumber: input.phoneNumber,
          phoneCode: input.phoneCode
        }, {
          email: input.email
        }
      ]
    })
    if (validate) {
      // this.logger.error('Phone number or email already exist')
      throw new HttpException('Phone number or email already exist', HttpStatus.BAD_REQUEST)
    }
    const member = await this.memberRepo.save(this.memberRepo.create(input))
    const memberAudit: IAuditLog = {
      requestBody: JSON.stringify({ ...input }),
      action: 'member.retrieve.createMember'
    }
    this.eventEmitter.emit('event.auditlog', memberAudit)
    const afterCreate = await this.afterCreateMember(member.id);
    return {
      member,
      loyalty: afterCreate.loyalty
    };
  }

  async afterCreateMember(memberId: number): Promise<{ loyalty: MemberLoyalty }> {
    const loyalty = await this.memberLoyaltyRepo.save(this.memberLoyaltyRepo.create({ memberId, totalPointBalance: 0 }))
    const memberLoyaltyAudit: IAuditLog = {
      requestBody: JSON.stringify({ memberId, totalPointBalance: 0 }),
      action: 'member.retrieve.createMemberLoyalty'
    }
    this.eventEmitter.emit('event.auditlog', memberLoyaltyAudit)
    return {
      loyalty
    }
  }

  async updateMember(id: number, input: Member): Promise<Member> {
    const find = await this.findOneMemberByAttribute({ where: { id } });
    if (!find)
      throw new HttpException('Member not found!', HttpStatus.NOT_FOUND)
    await this.memberRepo.update(find, input);
    const memberLogEventInterface: StoreMemberLogEvent = {
      memberId: find.id,
      field: 'fullname',
      beforeValue: find.fullname,
      afterValue: input.fullname
    }
    this.eventEmitter.emit(MemberEventEnum.MEMBER_UPDATE_MEMBERLOG, memberLogEventInterface)
    const findAfterUpdate = await this.findOneMemberByAttribute({ where: { id } });
    return findAfterUpdate
  }

  async getMember(memberId: number): Promise<[Member, MemberLoyalty, Point[]]> {
    const member = await this.findOneMemberByAttribute({ where: { id: memberId } })
    if (!member)
      throw new HttpException('Member not found!', HttpStatus.NOT_FOUND)

    const memberAudit: IAuditLog = {
      requestBody: JSON.stringify({ memberId }),
      action: 'member.retrieve.getMember'
    }
    this.eventEmitter.emit('event.auditlog', memberAudit)

    const memberLoyalty = await this.findOneMemberLoyaltyByAttribute({ where: { memberId } })
    const memberLoyaltyAudit: IAuditLog = {
      requestBody: JSON.stringify({ memberId }),
      action: 'member.retrieve.getMemberLoyalty'
    }
    this.eventEmitter.emit('event.auditlog', memberLoyaltyAudit)
    const points = await this.pointService.findPointByAttribute({ where: { memberId } })
    const pointAudit: IAuditLog = {
      requestBody: JSON.stringify({ memberId }),
      action: 'member.retrieve.getPoint'
    }
    this.eventEmitter.emit('event.auditlog', pointAudit)
    return [member, memberLoyalty, points]
  }

  async addPointMember(memberId: number, point: number): Promise<[Member, MemberLoyalty]> {
    const member = await this.findOneMemberByAttribute({ where: { id: memberId } })
    await this.memberLoyaltyRepo.increment({ memberId }, 'totalPointBalance', point)
    const memberLoyalty = await this.findOneMemberLoyaltyByAttribute({ where: { memberId }, order: { id: 'desc' } })
    return [member, memberLoyalty]

  }

  @OnEvent(MemberEventEnum.MEMBER_UPDATE_MEMBERLOG)
  private createMemberLog(payload: StoreMemberLogEvent): void {
    this.memberLogRepo.save(this.memberLogRepo.create({
      memberId: payload.memberId,
      field: payload.field,
      beforeValue: payload.beforeValue,
      afterValue: payload.afterValue
    }))
  }

}
