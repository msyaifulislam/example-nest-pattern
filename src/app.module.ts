import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from './modules/member/member.module';
import { PointModule } from './modules/point/point.module';
import { Member } from './modules/member/entities/member.entity';
import { MemberLoyalty } from './modules/member/entities/member-loyalty.entity';
import { MemberLog } from './modules/member/entities/member-log.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

const registerModule = [
  TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'rootpassword123!@#',
    database: 'example_app',
    entities: [Member, MemberLoyalty, MemberLog],
    synchronize: true,
  }),
  EventEmitterModule.forRoot(),
]

@Module({
  imports: [
    ...registerModule,
    MemberModule,
    PointModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
