import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

export class CreateMemberRequest {
  @IsString()
  referalCode: string;

  @IsString()
  fullname: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;
}

export interface CreateMemberResponse {
  fullname: string;
  email: string;
  phone: string;
  memberCode: string;
  loyalty: {
    totalPointBalance: number;
  }
}

export class UpdateMemberRequest {
  @IsString()
  fullname: string;
}

export interface UpdateMemberResponse {
  fullname: string;
  email: string;
  phone: string;
  memberCode: string;
}

export interface GetMemberResponse {
  fullname: string;
  email: string;
  phone: string;
  memberCode: string;
  loyalty: {
    totalPointBalance: number;
  }
  logs: IMemberLogResponse[]
}

interface IMemberLogResponse {
  field: string;
  beforeValue: string;
  afterValue: string;
}
