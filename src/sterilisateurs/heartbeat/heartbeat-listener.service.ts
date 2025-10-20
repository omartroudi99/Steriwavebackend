// src/sterilisateurs/heartbeat/heartbeat-listener.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { HeartbeatGateway } from './heartbeat.gateway';
import { FRESH_MS, FUTURE_SKEW_MS } from './heartbeat.constants';

@Injectable()
export class HeartbeatListenerService implements OnModuleInit, OnModuleDestroy {
  private rootUnsub?: () => void;
  private deviceUnsub = new Map<string, () => void>();
  private lastStatus = new Map<string, 'online'|'offline'|string>();
  private lastTs = new Map<string, number>();           
  private watchdog?: NodeJS.Timeout;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly heartbeatGateway: HeartbeatGateway,
  ) {}

  onModuleInit() {
    const devicesRef = this.firebaseService.rtdb.ref('steriwave/devices');
const onAdded = devicesRef.on('child_added', (snap) => this.attach(snap.key!));
const onRemoved = devicesRef.on('child_removed', (snap) => this.detach(snap.key!));


    this.rootUnsub = () => {
      devicesRef.off('child_added', onAdded);
      devicesRef.off('child_removed', onRemoved);
    };

    // ✅ Watchdog : toutes les 10s on force offline si périmé
    this.watchdog = setInterval(() => this.scanForOffline(), 10_000);
  }

  onModuleDestroy() {
    if (this.rootUnsub) this.rootUnsub();
    for (const id of this.deviceUnsub.keys()) this.detach(id);
    this.lastStatus.clear();
    this.lastTs.clear();
    if (this.watchdog) clearInterval(this.watchdog);
  }

  private clampFuture(tsMs: number): number {
    const max = Date.now() + FUTURE_SKEW_MS;
    return tsMs > max ? max : tsMs;
  }

private async setStatus(
  deviceId: string,
  status: 'online'|'offline',
  tsMs: number,
  connection_type: string|null
) {
  // 1) Toujours persister dans Firestore
  try {
    await this.firebaseService.db.collection('sterilizers').doc(deviceId).set(
      { status, connection_type, lastSeen: new Date(tsMs) },
      { merge: true },
    );
  } catch (e) {
    console.error('🔥 Firestore set status', deviceId, status, e);
  }

  // 2) N'émettre que sur transition; et UNIQUEMENT pour 'offline'
  const prev = this.lastStatus.get(deviceId);
if (prev !== status) {
  this.lastStatus.set(deviceId, status);

  // 1) statut unifié pour le front (UI se met à jour dans tous les cas)
  this.heartbeatGateway.sendStatus({ deviceId, status, connection_type, ts: Date.now() });

  // 2) event spécifique uniquement pour offline
  if (status === 'offline') {
    this.heartbeatGateway.sendOffline({ deviceId, connection_type, ts: Date.now() });
  }
  console.log(`🔄 ${deviceId} ${prev ?? '(none)'} → ${status}`);
}

}


  private async scanForOffline() {
    const now = Date.now();
    for (const [deviceId, tsMs] of this.lastTs.entries()) {
      const isFresh = (now - tsMs) <= FRESH_MS;
      if (!isFresh && this.lastStatus.get(deviceId) !== 'offline') {
        console.log(`⏱️ Watchdog OFFLINE ${deviceId} (now=${now}, ts=${tsMs}, diff=${now - tsMs})`);
        await this.setStatus(deviceId, 'offline', tsMs, null);
      }
    }
  }

  private attach(deviceId: string) {
    if (this.deviceUnsub.has(deviceId)) return;

    const hbRef = this.firebaseService.rtdb.ref(`steriwave/devices/${deviceId}/heartbeat`);

    const onValue = hbRef.on('value', async (snap) => {
      const hb = snap.val();
      if (!hb) return;

      const connection_type = typeof hb.connection_type === 'string' ? hb.connection_type : null;

      const tsStr = typeof hb.timestamp === 'string' ? hb.timestamp : null;
      let tsMs = tsStr && !isNaN(Date.parse(tsStr)) ? Date.parse(tsStr) : NaN;
      if (Number.isNaN(tsMs)) {
        console.warn(`⚠️ ${deviceId} heartbeat sans timestamp valide:`, hb?.timestamp);
        return;
      }

      tsMs = this.clampFuture(tsMs);
      this.lastTs.set(deviceId, tsMs);

      const isFresh = (Date.now() - tsMs) <= FRESH_MS;
      const newStatus: 'online'|'offline' = isFresh ? 'online' : 'offline';

      console.log(
        `📡 HB ${deviceId} ts=${new Date(tsMs).toISOString()} ` +
        `now=${new Date().toISOString()} diff=${Date.now() - tsMs}ms status=${newStatus}`
      );

      await this.setStatus(deviceId, newStatus, tsMs, connection_type);
    });

    this.deviceUnsub.set(deviceId, () => hbRef.off('value', onValue));
  }

  private detach(deviceId: string) {
    const unsub = this.deviceUnsub.get(deviceId);
    if (unsub) {
      unsub();
      this.deviceUnsub.delete(deviceId);
    }
    this.lastStatus.delete(deviceId);
    this.lastTs.delete(deviceId);
  }
}
