import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ResallerService } from '../resaller/resaller.service';

@Controller('resaller')
export class ResallerController {
  constructor(private readonly resallerService: ResallerService) {}

  @Get(':email')
  getByAdmin(@Param('email') email: string) {
    return this.resallerService.getByAdmin(email);
  }

  @Post()
  addSterilizer(@Body() body: { deviceId: string; email: string }) {
    return this.resallerService.addSterilizerToVendue(body.deviceId, body.email);
  }

  @Delete(':deviceId')
  deleteSterilizer(@Param('deviceId') deviceId: string) {
    return this.resallerService.deleteSterilizerByDeviceId(deviceId);
  }
  
}