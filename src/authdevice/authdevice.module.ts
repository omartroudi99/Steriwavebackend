import { Module } from '@nestjs/common';
import { AuthDeviceController } from './authdevice.controller';
import { AuthDeviceService } from './authdevice.service';

@Module({
  controllers: [AuthDeviceController],
  providers: [AuthDeviceService],
})
export class AuthDeviceModule {}
