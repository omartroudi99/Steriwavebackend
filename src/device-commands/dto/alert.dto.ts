import { IsString, IsOptional } from 'class-validator';

export class DeviceAlertDto {
  @IsString()
  alert: string;          // ex: "human_detected"

  @IsString()
  cycle_id: string;       // ex: "CYC_1754488176"

  @IsOptional()
  @IsString()
  message?: string;       // ex: "cycle_paused"
}
