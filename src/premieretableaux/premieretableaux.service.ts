import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class PremieretableauxService {
  private db = admin.firestore();

  async getSterilisateurs(role: string, email: string) {
    const allSterilisateurs: any[] = [];

    if (role === 'supervisor') {
      // 🔹 Cas supervisor → lire tous les utilisateurs
      const usersSnapshot = await this.db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const steriRef = this.db
          .collection('users')
          .doc(userDoc.id)
          .collection('sterilisateurs');

        const steriSnapshot = await steriRef.get();

        for (const steriDoc of steriSnapshot.docs) {
          allSterilisateurs.push(steriDoc.data());
        }
      }

    } else if (role === 'visor') {
        // 🔹 Cas visor → trouver tous les users dont admin = email
        const usersRef = this.db.collection('users');
        const querySnapshot = await usersRef.where('admin', '==', email).get();
      
        if (querySnapshot.empty) {
          return []; // Aucun utilisateur trouvé
        }
      
        for (const userDoc of querySnapshot.docs) {
          const userId = userDoc.id;
      
          const steriSnapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('sterilisateurs')
            .get();
      
          for (const steriDoc of steriSnapshot.docs) {
            allSterilisateurs.push(steriDoc.data());
          }
        }
      }
      
    return allSterilisateurs;
  }
  // ✅ Ajoute cette méthode dans PremieretableauxService
 async assignSterilizersToUser(body: any) {
  const db = this.db;
  const email = body.email;
    const role = body.role; 
  const sterilizers = body.sterilizers; // tableau [{ deviceId, price, position, type, nometablissement }]

  // 🔍 Trouver l'utilisateur par email
  const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) {
    throw new Error(`Utilisateur avec email ${email} non trouvé`);
  }
  const userDoc = userQuery.docs[0];
  const userId = userDoc.id;

for (const sterilizer of sterilizers) {
  // 🔹 1. Met à jour /sterilizers
  const globalQuery = await db.collection('sterilizers')
    .where('deviceId', '==', sterilizer.deviceId)
    .limit(1)
    .get();

  if (!globalQuery.empty) {
    const globalDoc = globalQuery.docs[0];
    await globalDoc.ref.update({ venduepour: email });
  }

  // 🔹 2. Ajoute dans /users/{userId}/sterilisateurs
  const userSterilizerRef = db.collection('users').doc(userId)
    .collection('sterilisateurs').doc(sterilizer.deviceId);

  await userSterilizerRef.set({
    id: sterilizer.deviceId,
    name: sterilizer.deviceId,
    mail: email,
    price: sterilizer.price,
    position: sterilizer.position,
    sterilizertype: sterilizer.type,
    nometablissement: sterilizer.nometablissement,
    createdAt: new Date().toISOString(),
    horloge: '9000',
    horametremdps: '123',
    motion: false,
    scanned: false,
    vendue: true,
    work: false,
  });

  await userSterilizerRef.collection('actions').doc('initial').set({});

  // 🔹 3. Si le rôle est visor → mettre vendue = true
  if (role === 'visor') {
    const vendueQuery = await db.collection('sterilizersvendue')
      .where('deviceId', '==', sterilizer.deviceId)
      .limit(1)
      .get();

    if (!vendueQuery.empty) {
      const vendueDoc = vendueQuery.docs[0];
      await vendueDoc.ref.update({ vendue: true });
    }
  }
}


  return { statusCode: 200, message: 'Stérilisateurs assignés avec succès' };
 }
 async unassignSterilizerFromUser(deviceId: string, email: string, role: string) {
  const db = this.db;

  // 🔹 1. Trouver l'utilisateur avec cet email
  const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) {
    throw new Error(`Utilisateur avec email ${email} non trouvé`);
  }

  const userDoc = userQuery.docs[0];
  const userId = userDoc.id;

  // 🔹 2. Supprimer le stérilisateur du sous-chemin /users/{userId}/sterilisateurs/{deviceId}
  const sterilizerRef = db.collection('users').doc(userId).collection('sterilisateurs').doc(deviceId);
  await sterilizerRef.delete();

  // 🔹 3. Supprimer toute la sous-collection /actions
  const actionsRef = sterilizerRef.collection('actions');
  const actionsSnapshot = await actionsRef.get();
  const batch = db.batch();
  actionsSnapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  // 🔹 4. En fonction du rôle, effectuer une action différente
  if (role === 'supervisor') {
    // Supprimer le champ `venduepour` dans /sterilizers
    const globalQuery = await db.collection('sterilizers').where('deviceId', '==', deviceId).limit(1).get();
    if (!globalQuery.empty) {
      const sterilizerDoc = globalQuery.docs[0];
      await sterilizerDoc.ref.update({
        venduepour: admin.firestore.FieldValue.delete(),
      });
    } else {
      console.warn(`⚠️ ${deviceId} non trouvé dans /sterilizers`);
    }
  } else if (role === 'visor') {
    // Modifier `vendue: false` dans /sterilizersvendue
    const vendueQuery = await db.collection('sterilizersvendue')
      .where('deviceId', '==', deviceId)
      .limit(1)
      .get();

    if (!vendueQuery.empty) {
      const vendueDoc = vendueQuery.docs[0];
      await vendueDoc.ref.update({ vendue: false });
    } else {
      console.warn(`⚠️ ${deviceId} non trouvé dans /sterilizersvendue pour ${email}`);
    }
  }

  return { statusCode: 200, message: `Stérilisateur ${deviceId} désassigné avec succès` };
 }

 async updateSterilizerDetails(body: any) {
  const db = this.db;
  const { email, deviceId, price, horametremdps, horloge, type } = body;

  // 🔍 Trouver l'utilisateur par email
  const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) {
    throw new Error(`Utilisateur avec email ${email} non trouvé`);
  }

  const userDoc = userQuery.docs[0];
  const userId = userDoc.id;

  // 🔧 Référence vers le stérilisateur de l'utilisateur
  const sterilizerRef = db.collection('users').doc(userId).collection('sterilisateurs').doc(deviceId);

  const sterilizerSnapshot = await sterilizerRef.get();
  if (!sterilizerSnapshot.exists) {
    throw new Error(`Stérilisateur ${deviceId} introuvable pour l'utilisateur ${email}`);
  }

  // 🔄 Mise à jour partielle
  await sterilizerRef.update({
    price,
    horametremdps,
    horloge,
    sterilizertype: type,
  });

  return { statusCode: 200, message: `Stérilisateur ${deviceId} mis à jour avec succès` };
}

}
