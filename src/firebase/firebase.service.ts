// firebase.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';

@Injectable()
export class FirebaseService {
  public db: admin.firestore.Firestore;
  public rtdb: admin.database.Database;

  constructor() {
    if (admin.apps.length === 0) {
   admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://flutter-login-7364f-default-rtdb.firebaseio.com', 
});

    }

    this.db = admin.firestore();
    this.rtdb = admin.database(); // 🔁 Realtime DB
  }
}
