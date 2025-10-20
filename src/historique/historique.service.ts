import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

// ✅ Interface pour typer les données d'historique
export interface HistoriqueEntry {
  id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  cycle_id: string;
  option: string;
  radius: number;
  human_detected: boolean;
}

@Injectable()
export class HistoriqueService {
  private firestore = admin.firestore();

  async getHistoriqueByUserEmail(email: string): Promise<HistoriqueEntry[] | { error: string }> {
    const cleanedEmail = email.trim().toLowerCase();

    // ✅ Étape 1 : Chercher l'utilisateur par email
    const userSnap = await this.firestore
      .collection('users')
      .where('email', '==', cleanedEmail)
      .limit(1)
      .get();

    console.log('📩 Requête avec email :', cleanedEmail);
    console.log('📄 Documents trouvés :', userSnap.docs.map(d => d.id));

    if (userSnap.empty) {
      return { error: 'Utilisateur non trouvé' };
    }

    const userDoc = userSnap.docs[0];
    const userId = userDoc.id;

    // ✅ Étape 2 : Obtenir les stérilisateurs de l'utilisateur
    const steriSnap = await this.firestore
      .collection(`users/${userId}/sterilisateurs`)
      .get();

    const deviceIds = steriSnap.docs.map(doc => doc.id);
    console.log('🔧 Stérilisateurs trouvés :', deviceIds);

    if (deviceIds.length === 0) {
      return [];
    }

    // ✅ Étape 3 : Récupérer les historiques liés aux deviceIds
    const historiqueSnap = await this.firestore.collection('historique').get();

    const historiques: HistoriqueEntry[] = historiqueSnap.docs
      .map(doc => {
        const data = doc.data() as Omit<HistoriqueEntry, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      })
      .filter(entry => deviceIds.includes(entry.device_id));

    console.log('📊 Nombre d\'historiques trouvés :', historiques.length);

    return historiques;
  }
}
