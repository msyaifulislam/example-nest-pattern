import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateMemberRequest, CreateMemberResponse, GetMemberResponse, UpdateMemberRequest, UpdateMemberResponse } from './dtos/member.dto';
import { MemberService } from './member.service';
import { MemberUseCase } from './use-cases/member.use-case';

@Controller('member')
export class MemberController {
  constructor(
    private readonly memberUseCase: MemberUseCase,
    private readonly memberService: MemberService
  ) { }

  @Post()
  async createMember(@Body() input: CreateMemberRequest): Promise<CreateMemberResponse> {
    /** untuk refactor object body jadi entity */
    const createMemberUseCase = this.memberUseCase.createMemberInput(input);

    /** create data action */
    const create = await this.memberService.createMember(createMemberUseCase);

    /** BFF */
    const response = this.memberUseCase.createMemberOutput(create.member, create.loyalty);
    return response;
  }

  @Put(':id')
  async updateMember(@Param('id') id: string, @Body() input: UpdateMemberRequest): Promise<UpdateMemberResponse> {
    const updateMemberUsecase = this.memberUseCase.updateMemberInput(input);
    const update = await this.memberService.updateMember(Number(id), updateMemberUsecase);
    const response = this.memberUseCase.updateMemberOutput(update)
    return response
  }

  @Get(':id')
  async getMember(@Param('id') id: string): Promise<GetMemberResponse> {
    const getData = await this.memberService.getMember(Number(id))
    const response = this.memberUseCase.getMemberOutput(...getData)
    return response;
  }

}