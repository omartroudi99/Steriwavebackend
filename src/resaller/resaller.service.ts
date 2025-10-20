import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class ResallerService {
  constructor(private readonly firebase: FirebaseService) {}

  private get db() {
    return this.firebase.db;
  }

  async getByAdmin(email: string) {
    const snapshot = await this.db.collection('sterilizersvendue')
      .where('admin', '==', email)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addSterilizerToVendue(deviceId: string, email: string) {
    // 🔍 Cherche le document dans la collection 'sterilizers' par son champ 'deviceId'
    const querySnapshot = await this.db.collection('sterilizers')
      .where('deviceId', '==', deviceId)
      .get();
  
    if (querySnapshot.empty) {
      throw new Error(`Sterilizer with deviceId ${deviceId} not found`);
    }
  
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    const sterilizerRef = doc.ref;
  
    // 📝 Ajoute dans la collection 'sterilizersvendue'
    const newDoc = await this.db.collection('sterilizersvendue').add({
      admin: email,
      deviceId: data.deviceId,
      firmwareVersion: data.firmwareVersion,
      model: data.model,
      registeredAt: data.registeredAt,
      vendue: false,
    });
  
    // 🔄 Met à jour le champ 'venduepour' dans le document original
    await sterilizerRef.update({ venduepour: email });
  
    return { message: 'Sterilizer successfully added to sterilizersvendue', id: newDoc.id };
  }
  

  async deleteSterilizerByDeviceId(deviceId: string) {
    // 🔍 Trouver dans /sterilizersvendue par deviceId
    const vendueQuery = await this.db.collection('sterilizersvendue')
      .where('deviceId', '==', deviceId)
      .get();
  
    if (vendueQuery.empty) {
      throw new Error(`No document in sterilizersvendue with deviceId ${deviceId}`);
    }
  
    const vendueDoc = vendueQuery.docs[0];
    const vendueRef = vendueDoc.ref;
    await vendueRef.delete();
  
    // 🔍 Trouver le stérilisateur original dans /sterilizers
    const sterilizerQuery = await this.db.collection('sterilizers')
      .where('deviceId', '==', deviceId)
      .get();
  
    if (sterilizerQuery.empty) {
      throw new Error(`No sterilizer found with deviceId ${deviceId}`);
    }
  
    const sterilizerRef = sterilizerQuery.docs[0].ref;
    await sterilizerRef.update({
      venduepour: admin.firestore.FieldValue.delete(),
    });
  
    return { message: `Sterilizer ${deviceId} removed from vendue list and updated` };
  }
  
}
