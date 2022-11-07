import {
  Body,
  Controller,
  Post,
  Req,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { METADATA_AUDITLOG } from 'src/core/constants/audit-log.constant';
import { MicroserviceInterceptor } from 'src/core/interceptors/microservice.interceptor';
import {
  AddPointMemberRequest,
  AddPointMemberResponse,
} from './dtos/point.dto';
import { PointService } from './point.service';
import { PointUseCase } from './use-cases/point.use-case';

@Controller('point')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly pointUseCase: PointUseCase,
  ) {}

  @Post()
  @UseInterceptors(MicroserviceInterceptor)
  @SetMetadata(METADATA_AUDITLOG, 'point.add')
  async addPointMember(
    @Body() body: AddPointMemberRequest,
    @Req() { requestID },
  ): Promise<AddPointMemberResponse> {
    console.log(requestID);
    const addPointUsecase = await this.pointUseCase.addPointInput(body);
    const [member, memberLoyalty] = await this.pointService.addPointMember(
      addPointUsecase,
      requestID,
    );
    const response = this.pointUseCase.addPointOutput(member, memberLoyalty);
    return response;
  }
}
