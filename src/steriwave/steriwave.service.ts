import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'; // ← ajouter ForbiddenException
import { FirebaseService } from '../firebase/firebase.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class SteriWaveService {
  constructor(private readonly firebase: FirebaseService) {}

  private collectionName = 'sterilizers';

  async registerDevice(dto: RegisterDeviceDto) {
  const db = this.firebase.db;
  const snapshot = await db.collection(this.collectionName).get();
  const sterilizerId = `sterilizer${snapshot.size + 1}`;

  const data = {
    deviceId: dto.deviceId,
    model: dto.model,
    firmwareVersion: dto.firmwareVersion,
    registeredAt: new Date().toISOString(),
  };

  // 🔵 Firestore (facultatif, si tu veux garder les deux)
  await db.collection(this.collectionName).doc(sterilizerId).set(data);

  // 🟢 Realtime Database (obligatoire pour WebSocket)
  //await this.firebase.rtdb.ref(`sterilizers/${sterilizerId}`).set(data);

  return {
    statusCode: 200,
    message: `Sterilizer ${sterilizerId} registered successfully`,
    id: sterilizerId,
  };
}
async getAllSterilizers(role: string, email: string) {
  const db = this.firebase.db;
  const rtdb = this.firebase.rtdb;

  if (role === 'supervisor') {
    const snapshot = await db.collection('sterilizers').get();
    const firestoreDocs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => !doc.venduepour) as any[];

    const enriched = await Promise.all(
      firestoreDocs.map(async (doc) => {
        const deviceId = doc.device_id || doc.deviceId || doc.id;
        if (!deviceId) return doc;

        let model = 'N/A';
        let firmwareVersion = 'N/A';
        let registeredAt = doc.registeredAt || 'N/A';

        try {
          // ✅ Lire model et firmware depuis /register
          const registerSnap = await rtdb
            .ref(`steriwave/devices/${deviceId}/register`)
            .get();

          if (registerSnap.exists()) {
            const data = registerSnap.val();
            model = data.model || 'N/A';
            firmwareVersion = data.firmware_version || 'N/A';
          }

          // ✅ Lire timestamp depuis /heartbeat comme registeredAt
          const heartbeatSnap = await rtdb
            .ref(`steriwave/devices/${deviceId}/heartbeat`)
            .get();

          if (heartbeatSnap.exists()) {
            const hbData = heartbeatSnap.val();
            registeredAt = hbData.timestamp || doc.registeredAt || 'N/A';
          }

        } catch (e) {
          console.warn(`⚠️ RTDB introuvable pour ${deviceId}`);
        }

        return {
          ...doc,
          deviceId,
          model,
          firmwareVersion,
          registeredAt,
        };
      })
    );

    return enriched;
  }

  if (role === 'visor') {
    const snapshot = await db.collection('sterilizersvendue')
      .where('admin', '==', email)
      .where('vendue', '==', false)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  return [];
}
  async syncSterilizersFromRealtime() {
  const dbRealtime = this.firebase.rtdb;
  const dbFirestore = this.firebase.db;

  // 1. Lire tous les stérilisateurs depuis Realtime Database
  const snapshot = await dbRealtime.ref('/steriwave/register').get();
  if (!snapshot.exists()) return { message: 'Aucun stérilisateur trouvé dans Realtime DB.' };

  const realtimeData = snapshot.val();
  type RealtimeSterilizer = {
  device_id: string;
  model?: string;
  firmware_version?: string;
};
const entries = Object.values(realtimeData) as any[];

  // 2. Lire tous les deviceId existants dans Firestore
  const firestoreSnapshot = await dbFirestore.collection('sterilizers').get();
  const existingIds = firestoreSnapshot.docs.map(doc => doc.data().deviceId);

  // 3. Ajouter ceux qui n'existent pas encore
  const added: string[] = [];

  for (const entry of entries) {
    const deviceId = entry.device_id;
    if (!deviceId || existingIds.includes(deviceId)) continue;

// 🔢 Extraire tous les numéros déjà utilisés dans les IDs
const existingDocs = firestoreSnapshot.docs.map(doc => doc.id);
const existingNumbers = existingDocs
  .map(id => parseInt(id.replace('sterilizer', '')))
  .filter(num => !isNaN(num));
let nextNumber = (existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1;

const added: string[] = [];

for (const entry of entries) {
  const deviceId = entry.device_id;
  if (!deviceId || existingIds.includes(deviceId)) continue;

  const newSterilizerId = `sterilizer${nextNumber}`;
  nextNumber++; // 🔁 Incrémenter pour le prochain

  const newData = {
    deviceId: deviceId,
    model: entry.model || '',
    firmwareVersion: entry.firmware_version || '',
    registeredAt: new Date().toISOString(),
  };

  await dbFirestore.collection('sterilizers').doc(newSterilizerId).set(newData);
 // await dbRealtime.ref(`sterilizers/${newSterilizerId}`).set(newData);

  added.push(newSterilizerId);
}

    added.push(deviceId);
  }

  return { message: 'Synchronisation terminée.', added };
}

  async getSterilizerById(id: string) {
    const doc = await this.firebase.db.collection(this.collectionName).doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException(`Sterilizer ${id} not found`);
    }

    const data = doc.data();

    // 🔒 Refuser si déjà assigné
    if (data?.venduepour) {
      throw new ForbiddenException(`Sterilizer ${id} is already assigned`);
    }

    return { id: doc.id, ...data };
  }

  async updateSterilizer(id: string, data: Partial<RegisterDeviceDto>) {
    const ref = this.firebase.db.collection(this.collectionName).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Sterilizer ${id} not found`);
    }

    await ref.update({ ...data });
    return { statusCode: 200, message: `Sterilizer ${id} updated` };
  }

  async deleteSterilizer(id: string) {
    const ref = this.firebase.db.collection(this.collectionName).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Sterilizer ${id} not found`);
    }

    await ref.delete();
    return { statusCode: 200, message: `Sterilizer ${id} deleted` };
  }
  
}
