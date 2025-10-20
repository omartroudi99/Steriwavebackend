import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase as getRTDB } from 'firebase-admin/database';
import * as serviceAccount from '../../firebase-admin-sdk.json';

function toStr(v: any, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.join('');
  if (v && typeof v === 'object' && '0' in v) {
    return Object.keys(v).sort((a, b) => +a - +b).map(k => (v as any)[k]).join('');
  }
  return v != null ? String(v) : fallback;
}

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: any, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

@Injectable()
export class FirebaseHistoryConsumer {
  constructor() {
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: 'https://flutter-login-7364f-default-rtdb.firebaseio.com', // requis pour RTDB Admin
      });
    }
  }

  @RabbitSubscribe({
    exchange: 'firebase-exchange',
    routingKey: '',
    queue: 'firebase-data',
  })
  async handleMessage(message: any) {
    console.log('📥 Message reçu dans NestJS:', message);

    const { timestamp, data, device_id, record_id } = message;

    if (!device_id) {
      console.error('❌ device_id manquant dans le message');
      return;
    }

    // On n’enregistre que des objets complets
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.warn('⏭️ Ignoré: data n’est pas un objet complet ->', data);
      return;
    }

    const firestore = getFirestore();
    const rtdb = getRTDB();

    // Mapping défensif / normalisation
    const doc = {
      device_id: toStr(device_id),
      cycle_id: toStr(data.cycle_id ?? data.cycleId),
      start_time: toStr(data.start_time ?? data.startTime),
      end_time: toStr(data.end_time ?? data.endTime),
      option: toStr(data.option ?? data.mode),
      radius: toNum(data.radius),
      human_detected: toBool(data.human_detected),
      source_ts: toStr(timestamp),
      record_id: toStr(record_id), // pour traçage
      ingested_at: new Date().toISOString(),
    };

    // 1) Chaque message = NOUVELLE stérilisation Firestore (ID auto)
    const ref = await firestore.collection('historique').add(doc);
    console.log(`✅ Nouvelle stérilisation enregistrée (docId=${ref.id}) pour device ${device_id}`);

    // 2) RTDB: supprimer TOUT le nœud "historique" du device
    const basePath = `steriwave/devices/${device_id}/historique`;
    try {
      await rtdb.ref(basePath).remove(); // 👈 purge complète
      console.log(`🗑️ RTDB supprimé: ${basePath}`);
    } catch (e) {
      // La donnée est déjà migrée; on log l’échec de nettoyage sans rollback
      console.error('⚠️ Échec de suppression RTDB:', e);
    }
  }
}
