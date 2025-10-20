import { Module } from '@nestjs/common';
import { HourMetreController } from './hourmetre.controller';
import { HourMetreService } from './hourmetre.service';

@Module({
  controllers: [HourMetreController],
  providers: [HourMetreService],
})
export class HourMetreModule {}
