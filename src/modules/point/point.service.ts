import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { MemberLoyalty } from '../member/entities/member-loyalty.entity';
import { Member } from '../member/entities/member.entity';
import { MemberService } from '../member/member.service';
import { AddPointMemberRequest } from './dtos/point.dto';
import { Point } from './entities/point.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepo: Repository<Point>,
    private readonly memberService: MemberService
  ) { }

  async findOnePointByAttribute(option: FindOneOptions<Point>): Promise<Point> {
    return await this.pointRepo.findOne(option)
  }

  async findPointByAttribute(option: FindManyOptions<Point>): Promise<Point[]> {
    return await this.pointRepo.find(option)
  }

  async addPointMember(input: Point): Promise<[Member, MemberLoyalty]> {
    await this.pointRepo.save(this.pointRepo.create({ ...input }))
    return await this.memberService.addPointMember(input.memberId, input.point)
  }
}
