import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class HourMetreService {
  async updateHorloge(id: string, horametremdps: string) {
    const firestore = admin.firestore();

    const usersSnapshot = await firestore.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      const sterilizersRef = userDoc.ref.collection('sterilisateurs');
      const sterilizerDoc = await sterilizersRef.doc(id).get();

      if (sterilizerDoc.exists) {
        const data = sterilizerDoc.data();
        if (data?.horametremdps === horametremdps) {
          await sterilizerDoc.ref.update({ horloge: '9000' });
          return { message: 'Horloge updated to 9000 ✅', success: true };
        } else {
          return { message: '❌ horametremdps mismatch', success: false };
        }
      }
    }

    return { message: '❌ Sterilizer not found', success: false };
  }
}
