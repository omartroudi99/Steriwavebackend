import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class ClockService {
async getClocksByUserEmail(email: string) {
  const db = getFirestore();

  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    return [];
  }

  const userId = usersSnapshot.docs[0].id;
  const steriSnapshot = await db.collection(`users/${userId}/sterilisateurs`).get();

  return steriSnapshot.docs.map(doc => {
    const data = doc.data();
    const horlogeRaw = data.horloge || '0';
    const horlogeNumber = parseInt(horlogeRaw, 10);

    let formattedHorloge = horlogeRaw;
    if (!isNaN(horlogeNumber)) {
      if (horlogeNumber >= 1000) {
        formattedHorloge = `${(horlogeNumber / 1000).toString().replace('.', ',')}K`;
      } else {
        formattedHorloge = horlogeNumber.toString();
      }
    }

    return {
      id: doc.id,
      horloge: formattedHorloge,
    };
  });
}


  async updateHorloge(email: string, deviceId: string, horloge: string) {
  const db = getFirestore();

  // 🔍 Trouver l'utilisateur par email
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();
  if (usersSnapshot.empty) {
    return { message: 'Utilisateur non trouvé' };
  }

  const userId = usersSnapshot.docs[0].id;

  // ✅ Mettre à jour le champ horloge
  const ref = db.doc(`users/${userId}/sterilisateurs/${deviceId}`);
  await ref.set({ horloge }, { merge: true });

  return { message: 'Horloge mise à jour', deviceId, horloge };
}

}
