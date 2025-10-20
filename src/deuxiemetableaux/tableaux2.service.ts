import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from '../steriwave/dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { UpdateUserDto } from '../steriwave/dto/update-user.dto';
import { GetUsersSummaryDto } from '../steriwave/dto/get-users-summary.dto';
@Injectable()
export class Tableaux2Service {
  constructor(private readonly firebase: FirebaseService) {}

  async createUser(dto: CreateUserDto) {
    const db = this.firebase.db;
    const auth = admin.auth();
  
    const now = new Date();
    const createdAt = now.toISOString();
  
    let authUser;
    try {
      // 🔹 0. Créer compte Firebase Auth
      authUser = await auth.createUser({
        email: dto.email,
        password: dto.mdps,
      });
      console.log(`✅ Utilisateur Auth Firebase créé : ${authUser.uid}`);
    } catch (error) {
      console.error('❌ Erreur création Auth Firebase :', error.message);
      throw new Error('Erreur Firebase Auth : ' + error.message);
    }
  
    // 🔹 1. Utiliser le même UID pour Firestore
    const userId = authUser.uid;
    const userRef = db.collection('users').doc(userId);
  
    await userRef.set({
      admin: dto.admin,
      createdAt,
      email: dto.email,
      name: dto.name,
      uidAuth: userId, // 🔄 Facultatif, redondant
    });
  
    // 🔹 2. /users/{userId}/clinique
    await userRef.collection('clinique').doc(uuidv4()).set({
      adresse: dto.adresse,
      mail: dto.email,
      mdps: dto.mdps,
      nometablissement: dto.nometablissement,
      type: dto.type,
    });
  
    // 🔹 3. /users/{userId}/bacterie (vide)
    await userRef.collection('bacterie').doc(uuidv4()).set({});
  
    // 🔹 4. /users/{userId}/salles (vide)
    await userRef.collection('salles').doc(uuidv4()).set({});
  
    // 🔹 5. /users/{userId}/sterilisateurs + actions
    for (const sterilizer of dto.selectedSterilizers) {
      const sterilizerId = sterilizer.deviceId;
      const sterilizerRef = userRef.collection('sterilisateurs').doc(sterilizerId);
  
      await sterilizerRef.set({
        clé: "123",
        createdAt,
        horametremdps: "123",
        horloge: "9000",
        id: sterilizer.deviceId,
        mail: dto.email,
        motion: false,
        name: sterilizer.deviceId,
        nometablissement: dto.nometablissement,
        position: dto.adresse,
        price: sterilizer.price,
        scanned: false,
        sterilizertype: dto.type,
        vendue: true,
        work: false,
      });
  
      // 🔹 Ajout du sous-document actions vide
      await sterilizerRef.collection('actions').doc(uuidv4()).set({});
  
      // 🔹 Mise à jour dans /sterilizers/{deviceId}
      const sterilizersGlobalQuery = await db
        .collection('sterilizers')
        .where('deviceId', '==', sterilizer.deviceId)
        .get();
  
      if (!sterilizersGlobalQuery.empty) {
        const doc = sterilizersGlobalQuery.docs[0];
        await doc.ref.update({ venduepour: dto.email });
        console.log(`✅ Sterilizer ${sterilizer.deviceId} mis à jour avec venduepour = ${dto.email}`);
      } else {
        console.warn(`⚠️ Sterilizer ${sterilizer.deviceId} non trouvé dans /sterilizers`);
      }
    }
    for (const sterilizer of dto.selectedSterilizers) {
      const snapshot = await db
        .collection('sterilizersvendue')
        .where('deviceId', '==', sterilizer.deviceId)
        .where('admin', '==', dto.admin)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({ vendue: true });
        console.log(`🔄 Mise à jour: sterilizersvendue → ${sterilizer.deviceId} => vendue: true`);
      }
    }
    return {
      statusCode: 200,
      message: `Utilisateur ${dto.email} créé avec succès`,
      userId,
      firebaseUid: userId, // même valeur
    };
  }
  
  async updateUser(dto: UpdateUserDto) {
      console.log('📩 Reçu updateUser avec DTO :', dto);

    const db = this.firebase.db;
    const auth = admin.auth();
  
    const userRef = db.collection('users').doc(dto.userId);
    console.log('🔍 Vérification du document clinique pour userId =', dto.userId);

  
    // 🔍 Récupérer le document clinique existant
    const cliniqueSnapshot = await userRef.collection('clinique').get();
    if (cliniqueSnapshot.empty) {
      throw new Error("Aucun document clinique trouvé pour cet utilisateur.");
    }
    const cliniqueDoc = cliniqueSnapshot.docs[0];
  
    // 🔐 Mise à jour dans Firebase Authentication
    if (dto.newEmail || dto.newPassword) {
      const updatePayload: Partial<admin.auth.UpdateRequest> = {};
      if (dto.newEmail) updatePayload.email = dto.newEmail;
      if (dto.newPassword) updatePayload.password = dto.newPassword;
  
      try {
        await auth.updateUser(dto.uidAuth, updatePayload);
        console.log(`✅ Auth mis à jour pour UID: ${dto.uidAuth}`);
      } catch (error) {
        console.error("❌ Erreur update Auth:", error.message);
        throw new Error("Erreur mise à jour Firebase Auth : " + error.message);
      }
    }
  
    // 📝 Mise à jour dans /users/{userId}
    if (dto.newEmail) {
      await userRef.update({ email: dto.newEmail });
    }
  
    // 📝 Mise à jour dans /users/{userId}/clinique/{doc}
    const updates: any = {};
    if (dto.newEmail) updates.mail = dto.newEmail;
    if (dto.newPassword) updates.mdps = dto.newPassword;
    if (dto.nometablissement) updates.nometablissement = dto.nometablissement;
    if (dto.adresse) updates.adresse = dto.adresse;
    if (dto.type) updates.type = dto.type;
  
    if (Object.keys(updates).length > 0) {
      await cliniqueDoc.ref.update(updates);
      console.log("✅ Clinique mise à jour");
    }
    // 🔁 Mettre à jour venduepour dans /sterilizers si email changé
if (dto.newEmail) {
  const ancienEmail = cliniqueDoc.data().mail;
  const sterilizersGlobal = await db.collection('sterilizers')
    .where('venduepour', '==', ancienEmail)
    .get();

  for (const doc of sterilizersGlobal.docs) {
    await doc.ref.update({ venduepour: dto.newEmail });
    console.log(`🔁 Champ 'venduepour' mis à jour pour: ${doc.id}`);
  }
}

  // 🔁 Synchroniser aussi les données dans /users/{userId}/sterilisateurs/*
const sterilizersSnapshot = await userRef.collection('sterilisateurs').get();
for (const doc of sterilizersSnapshot.docs) {
  const updateSterilizer: any = {};
  if (dto.newEmail) updateSterilizer.mail = dto.newEmail;
  if (dto.nometablissement) updateSterilizer.nometablissement = dto.nometablissement;
  if (dto.adresse) updateSterilizer.position = dto.adresse;
  if (dto.type) updateSterilizer.sterilizertype = dto.type;

  if (Object.keys(updateSterilizer).length > 0) {
    await doc.ref.update(updateSterilizer);
    console.log(`✅ Stérilisateur ${doc.id} mis à jour`);
  }
}

    return {
      statusCode: 200,
      message: "Utilisateur mis à jour avec succès",
    };
  }
  async deleteUser(userId: string, uidAuth: string) {
    const db = this.firebase.db;
    const auth = admin.auth();
  
    let userEmail = '';
  
    try {
      // 🔍 Étape 0 : Lire l'email utilisateur avant suppression
      const cliniqueSnapshot = await db.collection('users').doc(userId).collection('clinique').get();
      if (!cliniqueSnapshot.empty) {
        userEmail = cliniqueSnapshot.docs[0].data().mail || '';
      } else {
        console.warn(`⚠️ Aucun document clinique trouvé pour userId=${userId}`);
      }
    } catch (e) {
      console.warn(`⚠️ Impossible de lire le mail avant suppression: ${e.message}`);
    }
  
    try {
      // 🔐 1. Supprimer de Firebase Auth
      await auth.deleteUser(uidAuth);
      console.log(`✅ Utilisateur Auth supprimé: ${uidAuth}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.warn(`⚠️ Aucun utilisateur Auth trouvé pour UID: ${uidAuth}`);
      } else {
        console.error(`❌ Erreur suppression Auth: ${e.message}`);
        throw new Error('Erreur lors de la suppression Auth');
      }
    }
  
    try {
      // 📂 2. Supprimer sous-collections Firestore
      const subcollections = ['clinique', 'bacterie', 'salles', 'sterilisateurs'];
      for (const sub of subcollections) {
        const snapshot = await db.collection('users').doc(userId).collection(sub).get();
        for (const doc of snapshot.docs) {
          await doc.ref.delete();
        }
      }
  
      // 📄 3. Supprimer document user principal
      await db.collection('users').doc(userId).delete();
      console.log(`✅ Utilisateur Firestore supprimé: ${userId}`);
  
      // 🧹 4. Supprimer stérilisateurs vendus à cet utilisateur
      if (userEmail) {
        const steriSnap = await db.collection('sterilizers')
          .where('venduepour', '==', userEmail)
          .get();
      
        for (const doc of steriSnap.docs) {
          await doc.ref.update({
            venduepour: admin.firestore.FieldValue.delete()  
          });
          console.log(`❌ Champ 'venduepour' supprimé de: ${doc.id}`);
        }
      }      
  
      return {
        statusCode: 200,
        message: `Utilisateur ${userId} supprimé avec succès`,
      };
    } catch (e) {
      console.error(`❌ Erreur suppression Firestore: ${e.message}`);
      throw new Error('Erreur lors de la suppression Firestore');
    }
  }
  
  async getUsersSummary(email: string, role: string) {
    const db = this.firebase.db;
  
    const result: {
      userId: string;
      email: string;
      adresse: string;
      mdps: string;
      nometablissement: string;
      type: string;
      nbSterilisateurs: number;
    }[] = [];
  
    let snapshot;
    if (role === 'supervisor') {
      snapshot = await db.collection('users').get();
    } else if (role === 'visor') {
      snapshot = await db.collection('users')
        .where('admin', '==', email)
        .get();
    } else {
      throw new Error('Rôle utilisateur non reconnu');
    }
  
    for (const doc of snapshot.docs) {
      const userId = doc.id;
  
      const cliniqueSnapshot = await db.collection('users').doc(userId).collection('clinique').get();
      const sterilizersSnapshot = await db.collection('users').doc(userId).collection('sterilisateurs').get();
  
      if (!cliniqueSnapshot.empty) {
        const clinique = cliniqueSnapshot.docs[0].data();
  
        let count = 0;
        for (const sterilizerDoc of sterilizersSnapshot.docs) {
          const data = sterilizerDoc.data();
          if (data && data.id && data.price) {
            count++;
          }
        }
  
        result.push({
          userId,
          email: clinique.mail,
          adresse: clinique.adresse,
          mdps: clinique.mdps,
          nometablissement: clinique.nometablissement,
          type: clinique.type,
          nbSterilisateurs: count,
        });
      }
    }
  
    return result;
  }
  
  
}
