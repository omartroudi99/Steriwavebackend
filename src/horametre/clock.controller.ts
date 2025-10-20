import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { ClockService } from './clock.service';

@Controller('clock')
export class ClockController {
  constructor(private readonly clockService: ClockService) {}

  @Get()
  async getClocks(@Query('email') email: string) {
    return this.clockService.getClocksByUserEmail(email);
  }

  @Put()
  async updateClock(@Body() body: { email: string; deviceId: string; horloge: string }) {
    return this.clockService.updateHorloge(body.email, body.deviceId, body.horloge);
  }
}
