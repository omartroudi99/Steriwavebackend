// src/user-data/user-data.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FRESH_MS } from '../sterilisateurs/heartbeat/heartbeat.constants';

@Injectable()
export class UserDataService {
  private db = admin.firestore();
  private rtdb = admin.database();

  async getUserCollectionsByEmail(email: string) {
    const userSnap = await this.db.collection('users').where('email', '==', email).get();
    if (userSnap.empty) return { error: 'Utilisateur non trouvé' };

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;

    const subCollections = await this.db.collection('users').doc(userId).listCollections();
    const collectionsData: Record<string, any[]> = {};

    for (const col of subCollections) {
      const colSnap = await col.get();
      collectionsData[col.id] = colSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Enrichir les stérilisateurs avec status calculé
    if (collectionsData['sterilisateurs']) {
      for (const sterilizer of collectionsData['sterilisateurs']) {
        const deviceId = sterilizer.id || sterilizer.device_id;
        if (!deviceId) continue;

        try {
          const hbSnap = await this.rtdb.ref(`steriwave/devices/${deviceId}/heartbeat`).get();
          const hb = hbSnap.val();

          const tsStr: string | null = typeof hb?.timestamp === 'string' ? hb.timestamp : null;
          const tsMs = tsStr && !isNaN(Date.parse(tsStr)) ? Date.parse(tsStr) : NaN;
          const isFresh = !Number.isNaN(tsMs) && (Date.now() - tsMs) <= FRESH_MS;

          sterilizer.connection_type = hb?.connection_type ?? null;
          sterilizer.status = isFresh ? 'online' : 'offline';
          sterilizer.lastSeen = tsStr ?? null;
        } catch (e) {
          sterilizer.connection_type = null;
          sterilizer.status = 'Erreur';
          sterilizer.lastSeen = null;
        }
      }
    }

    return { userId, email, collections: collectionsData };
  }
}
