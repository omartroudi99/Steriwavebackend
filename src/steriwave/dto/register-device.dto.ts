import { IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  model: string;

  @IsString()
  firmwareVersion: string;
}
