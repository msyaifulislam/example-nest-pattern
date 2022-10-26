import { Injectable } from '@nestjs/common';
import { CreateMemberRequest, CreateMemberResponse, GetMemberResponse, UpdateMemberRequest, UpdateMemberResponse } from '../dtos/member.dto';
import { MemberLog } from '../entities/member-log.entity';
import { MemberLoyalty } from '../entities/member-loyalty.entity';
import { Member } from '../entities/member.entity';

@Injectable()
export class MemberUseCase {
  createMemberInput(input: CreateMemberRequest): Member {
    const member = new Member();
    member.referalCode = input.referalCode;
    member.email = input.email;
    member.fullname = input.fullname;
    member.memberCode = this.rand(6)
    member.phoneCode = input.phone.substring(1, 3)
    member.phoneNumber = input.phone.substring(3)
    return member;
  }

  createMemberOutput(member: Member, memberLoyalty: MemberLoyalty): CreateMemberResponse {
    return {
      email: member.email,
      fullname: member.fullname,
      memberCode: member.memberCode,
      phone: `${member.phoneCode}${member.phoneNumber}`,
      loyalty: {
        totalPointBalance: memberLoyalty.totalPointBalance
      }
    }
  }

  updateMemberInput(input: UpdateMemberRequest): Member {
    const member = new Member();
    member.fullname = input.fullname
    return member
  }

  updateMemberOutput(member: Member): UpdateMemberResponse {
    return {
      email: member.email,
      fullname: member.fullname,
      memberCode: member.memberCode,
      phone: `${member.phoneCode}${member.phoneNumber}`,
    }
  }

  getMemberOutput(member: Member, memberLoyalty: MemberLoyalty, memberLog: MemberLog[]): GetMemberResponse {
    return {
      email: member.email,
      fullname: member.fullname,
      memberCode: member.memberCode,
      phone: `${member.phoneCode}${member.phoneNumber}`,
      loyalty: {
        totalPointBalance: memberLoyalty.totalPointBalance
      },
      logs: memberLog
    }
  }

  private rand(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
