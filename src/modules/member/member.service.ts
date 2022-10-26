import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
@Injectable()
export class MemberService {
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
      throw new HttpException('Phone number or email already exist', HttpStatus.BAD_REQUEST)
    }
    const member = await this.memberRepo.save(this.memberRepo.create(input))
    const afterCreate = await this.afterCreateMember(member.id);
    return {
      member,
      loyalty: afterCreate.loyalty
    };
  }

  async afterCreateMember(memberId: number): Promise<{ loyalty: MemberLoyalty }> {
    const loyalty = await this.memberLoyaltyRepo.save(this.memberLoyaltyRepo.create({ memberId, totalPointBalance: 0 }))
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
    const memberLoyalty = await this.findOneMemberLoyaltyByAttribute({ where: { memberId } })
    const points = await this.pointService.findPointByAttribute({ where: { memberId } })
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
