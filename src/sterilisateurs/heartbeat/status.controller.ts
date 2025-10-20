// src/sterilisateurs/heartbeat/status.controller.ts
import { Controller, Get } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { FRESH_MS } from './heartbeat.constants';

@Controller('status')
export class StatusController {
  constructor(private readonly firebase: FirebaseService) {}

  @Get('all')
  async getAllStatus() {
    const ref = this.firebase.rtdb.ref('steriwave/devices');
    const snapshot = await ref.get();
    const devices = snapshot.val() ?? {};
    const now = Date.now();

    return Object.keys(devices).map((deviceId) => {
      const hb = devices[deviceId]?.heartbeat ?? {};
      const cycle = devices[deviceId]?.commands?.cycle_state ?? {};
      const tsStr: string | null = typeof hb?.timestamp === 'string' ? hb.timestamp : null;
      const tsMs = tsStr && !isNaN(Date.parse(tsStr)) ? Date.parse(tsStr) : NaN;
      const isFresh = !Number.isNaN(tsMs) && (now - tsMs) <= FRESH_MS;
      const status = isFresh ? 'online' : 'offline';

      return {
        device_id: deviceId,
        connection_type: hb?.connection_type ?? null,
        status,
        timestamp: tsStr,                // ISO string original
        lastSeenMs: Number.isNaN(tsMs) ? null : tsMs, // utile côté front
        sterilization_active: !!cycle?.sterilization_active,
        cycle_timestamp: cycle?.timestamp ?? null,
      };
    });
  }
}
