// src/sterilisateurs/cycle/cycle-state-listener.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { CycleGateway } from './cycle.gateway';

@Injectable()
export class CycleStateListenerService implements OnModuleInit, OnModuleDestroy {
  private rootUnsub?: () => void;
  private deviceUnsub = new Map<string, () => void>();
  private lastActive = new Map<string, boolean>(); // mémorise le dernier état booléen

  constructor(
    private readonly firebase: FirebaseService,
    private readonly cycleGateway: CycleGateway,
  ) {}

  onModuleInit() {
    const devicesRef = this.firebase.rtdb.ref('steriwave/devices');

    // Attacher les existants
    devicesRef.once('value', (snap) => {
      const devices = snap.val() ?? {};
      Object.keys(devices).forEach((id) => this.attach(id));
    });

    const onAdded = devicesRef.on('child_added', (snap) => this.attach(snap.key!));
    const onRemoved = devicesRef.on('child_removed', (snap) => this.detach(snap.key!));

    this.rootUnsub = () => {
      devicesRef.off('child_added', onAdded);
      devicesRef.off('child_removed', onRemoved);
    };
  }

  onModuleDestroy() {
    if (this.rootUnsub) this.rootUnsub();
    for (const id of this.deviceUnsub.keys()) this.detach(id);
    this.lastActive.clear();
  }

  private attach(deviceId: string) {
    if (this.deviceUnsub.has(deviceId)) return;

    // RTDB path: /steriwave/devices/{id}/commands/cycle_state
    const ref = this.firebase.rtdb.ref(`steriwave/devices/${deviceId}/commands/cycle_state`);

    const onValue = ref.on('value', async (snap) => {
      const val = snap.val() ?? {};
      const sterilization_active = !!val?.sterilization_active; // bool normalisé
      const ts =
        typeof val?.timestamp === 'string' && !isNaN(Date.parse(val.timestamp))
          ? new Date(val.timestamp)
          : admin.firestore.FieldValue.serverTimestamp();

      // 1) Persister dans Firestore (même doc que le statut si tu veux)
      try {
        await this.firebase.db.collection('sterilizers').doc(deviceId).set(
          {
            sterilization_active,
            cycleLastUpdate: ts,
          },
          { merge: true },
        );
      } catch (e) {
        console.error('🔥 Firestore cycle update failed:', e);
      }

      // 2) Edge-trigger → n’émettre que si ça change
      const prev = this.lastActive.get(deviceId);
      this.lastActive.set(deviceId, sterilization_active);

      if (prev !== sterilization_active) {
        // Event unifié
        this.cycleGateway.sendCycleState({
          deviceId,
          sterilization_active,
          ts: Date.now(),
        });

        // (Optionnel) Events séparés
        // if (sterilization_active) this.cycleGateway.sendCycleActive({ deviceId, ts: Date.now() });
        // else this.cycleGateway.sendCycleInactive({ deviceId, ts: Date.now() });

        console.log(
          `🧪 ${deviceId} cycle_state changed → sterilization_active=${sterilization_active}`,
        );
      } else {
        console.log(
          `ℹ️ ${deviceId} cycle_state identique (sterilization_active=${sterilization_active}), pas d'émission`,
        );
      }
    });

    this.deviceUnsub.set(deviceId, () => ref.off('value', onValue));
  }

  private detach(deviceId: string) {
    const unsub = this.deviceUnsub.get(deviceId);
    if (unsub) {
      unsub();
      this.deviceUnsub.delete(deviceId);
    }
    this.lastActive.delete(deviceId);
  }
}
