import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class HistoriqueService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: 'https://flutter-login-7364f-default-rtdb.firebaseio.com/',
      });
    }
  }

  async addHistorique(deviceId: string, data: any): Promise<void> {
    const ref = admin
      .database()
      .ref(`/steriwave/devices/${deviceId}/historique`);

    // Ajoute une entrée avec une clé automatique
    await ref.push(data);
  }
}
