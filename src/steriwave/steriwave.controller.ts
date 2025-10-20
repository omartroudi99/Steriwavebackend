import { Controller, Post, Get, Param, Body, Patch, Delete, Query } from '@nestjs/common';
import { SteriWaveService } from './steriwave.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('steriwave')
export class SteriWaveController {
  constructor(private readonly service: SteriWaveService) {}

  @Post('register')
  register(@Body() dto: RegisterDeviceDto) {
    return this.service.registerDevice(dto);
  }
@Get('sync-realtime')
syncFromRealtime() {
  return this.service.syncSterilizersFromRealtime();
}

  @Get()
  findAll(@Query('role') role: string, @Query('email') email: string) {
    return this.service.getAllSterilizers(role, email);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.getSterilizerById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<RegisterDeviceDto>) {
    return this.service.updateSterilizer(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.deleteSterilizer(id);
  }
}