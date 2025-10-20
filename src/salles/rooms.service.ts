import { Injectable, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class RoomsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private async getUserUidByEmail(email: string): Promise<string> {
    const usersSnapshot = await this.firebaseService.db.collection('users').get();
    const userDoc = usersSnapshot.docs.find(doc => doc.data().email === email);

    if (!userDoc) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return userDoc.id;
  }

  async createRoom(email: string, roomName: string) {
    const uid = await this.getUserUidByEmail(email);
    const roomRef = this.firebaseService.db.collection(`users/${uid}/salles`).doc();
    await roomRef.set({
      name: roomName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: roomRef.id, name: roomName };
  }

 async getRooms(email: string) {
  const uid = await this.getUserUidByEmail(email);
  const snapshot = await this.firebaseService.db.collection(`users/${uid}/salles`).get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    const timestamp = data.timestamp;

    return {
      id: doc.id,
      name: data.name,
      timestamp: timestamp
        ? format(timestamp.toDate(), "yyyy-MM-dd , hh:mma") // 👉 Exemple : 2025-01-30 , 10:00AM
        : null,
    };
  });
}

  async updateRoom(email: string, roomId: string, newName: string) {
    const uid = await this.getUserUidByEmail(email);
    const roomRef = this.firebaseService.db.doc(`users/${uid}/salles/${roomId}`);
    await roomRef.update({ name: newName });
    return { message: 'Room updated', id: roomId };
  }

  async deleteRoom(email: string, roomId: string) {
    const uid = await this.getUserUidByEmail(email);
    await this.firebaseService.db.doc(`users/${uid}/salles/${roomId}`).delete();
    return { message: 'Room deleted', id: roomId };
  }
}
