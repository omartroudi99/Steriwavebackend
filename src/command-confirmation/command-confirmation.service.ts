import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class CommandConfirmationService {
  async updateConfirmation(deviceId: string, command: string, status: number) {
    let key: string;
    let value: number | string;

    switch (command) {
      case 'start-cycle':
        key = status === 200 ? 'cycle started' : 'failed to start cycle';
        value = status;
        break;
      case 'pause-cycle':
        key = status === 200 ? 'cycle paused' : 'failed to pause cycle';
        value = status;
        break;
      case 'resume-cycle':
        key = status === 200 ? 'cycle resumed' : 'failed to resume cycle';
        value = status;
        break;
      case 'stop-cycle':
        key = status === 200 ? 'cycle stopped' : 'failed to stop cycle';
        value = status;
        break;
      case 'unlock':
        key = status === 200 ? 'lamp time reset' : 'unlock failed';
        value = status === 200 ? 200 : 'invalid code or internal error';
        break;
      default:
        throw new Error(`Commande inconnue : ${command}`);
    }

    const ref = admin
      .database()
      .ref(`steriwave/devices/${deviceId}/commands/confirmation`);

    await ref.set({ [key]: value });

    return { success: true, deviceId, command, confirmation: { [key]: value } };
  }
}
