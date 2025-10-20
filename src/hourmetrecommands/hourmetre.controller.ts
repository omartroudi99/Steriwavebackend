import { Controller, Post, Body } from '@nestjs/common';
import { HourMetreService } from './hourmetre.service';

@Controller('hourmetre')
export class HourMetreController {
  constructor(private readonly hourMetreService: HourMetreService) {}

  @Post('update')
  async updateHorloge(@Body() body: { id: string; horametremdps: string }) {
    return this.hourMetreService.updateHorloge(body.id, body.horametremdps);
  }
}
