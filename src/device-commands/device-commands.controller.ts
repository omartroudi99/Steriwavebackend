import { Controller, Put, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DeviceCommandsService } from './device-commands.service';
import { StartCycleDto } from './dto/start-cycle.dto';
import { CommandDto } from './dto/command.dto';
import { UnlockDto } from './dto/unlock.dto';
import { DeviceAlertDto } from './dto/alert.dto';

@Controller('steriwave/devices/:deviceId/commands')
export class DeviceCommandsController {
  constructor(private readonly service: DeviceCommandsService) {}

  @Put('start-cycle.json')
  startCycle(@Param('deviceId') deviceId: string, @Body() body: StartCycleDto) {
    return this.service.startCycle(deviceId, body);
  }
  @Put('stop-cycle.json')   stop(@Param('deviceId') id: string, @Body() _b: CommandDto) { return this.service.stopCycle(id); }
  @Put('pause-cycle.json')  pause(@Param('deviceId') id: string, @Body() _b: CommandDto) { return this.service.pauseCycle(id); }
  @Put('resume-cycle.json') resume(@Param('deviceId') id: string, @Body() _b: CommandDto) { return this.service.resumeCycle(id); }
  @Put('unlock.json')       unlock(@Param('deviceId') id: string, @Body() b: UnlockDto)   { return this.service.unlock(id, b.activationCode); }

  // ✅ Nouveau : écrit l’alerte dans Firebase RTDB
  @Put('alerts.json')
  @HttpCode(HttpStatus.ACCEPTED) 
  async receiveAlert(@Param('deviceId') deviceId: string, @Body() body: DeviceAlertDto) {
    return this.service.saveAlertToRtdb(deviceId, body);
  }
}
