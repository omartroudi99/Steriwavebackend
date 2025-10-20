import { Injectable, Logger } from '@nestjs/common';
import { DeviceAlertDto } from './dto/alert.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class DeviceCommandsService {
  private readonly logger = new Logger(DeviceCommandsService.name);

  async startCycle(deviceId: string, dto: { radius: number; option: string }) {
    return { message: `Started cycle on ${deviceId}`, params: dto };
  }
  async stopCycle(deviceId: string)   { return { message: `Stopped cycle on ${deviceId}` }; }
  async pauseCycle(deviceId: string)  { return { message: `Paused cycle on ${deviceId}` }; }
  async resumeCycle(deviceId: string) { return { message: `Resumed cycle on ${deviceId}` }; }
  async unlock(deviceId: string, code: string) {
    return { message: `Unlocked device ${deviceId} with code ${code}` };
  }

  // ✅ Nouveau : persiste l’alerte dans Realtime Database
  async saveAlertToRtdb(deviceId: string, payload: DeviceAlertDto) {
    const ref = admin.database().ref(`steriwave/devices/${deviceId}/alert`);
    // Si tu veux aussi un horodatage serveur :
    // const data = { ...payload, timestamp: admin.database.ServerValue.TIMESTAMP };
    await ref.set(payload);
    return { ok: true, path: `steriwave/devices/${deviceId}/alert`, data: payload };
  }
}
