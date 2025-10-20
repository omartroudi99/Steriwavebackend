import { Module } from '@nestjs/common';
import { DeviceCommandsController } from './device-commands.controller';
import { DeviceCommandsService } from './device-commands.service';

@Module({
  controllers: [DeviceCommandsController],
  providers: [DeviceCommandsService],
})
export class DeviceCommandsModule {}
