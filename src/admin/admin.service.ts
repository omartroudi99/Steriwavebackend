import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateAdminDto } from '../steriwave/dto/create-admin.dto';
import { UpdateAdminDto } from '../steriwave/dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly firebase: FirebaseService) {}

  async getVisors() {
    const db = this.firebase.db;
    const snapshot = await db.collection('admin').where('etat', '==', 'visor').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createAdmin(dto: CreateAdminDto & { deviceId?: string }) {
    const db = this.firebase.db;
  
    // 1. Créer l'admin dans la collection 'admin'
    const docRef = await db.collection('admin').add({
      mail: dto.mail,
      mdps: dto.mdps,
      etat: dto.etat,
    });
  
    // 2. Si un deviceId est fourni, effectuer le transfert
    if (dto.deviceId) {
      const sterilizerSnapshot = await db
        .collection('sterilizers')
        .where('deviceId', '==', dto.deviceId)
        .get();
  
      if (!sterilizerSnapshot.empty) {
        const sterilizerDoc = sterilizerSnapshot.docs[0];
        const sterilizerData = sterilizerDoc.data();
  
        // ➔ Mettre à jour le document existant dans 'sterilizers' avec venduepour
        await sterilizerDoc.ref.update({
          venduepour: dto.mail,
        });
  
        // ➔ Créer une copie dans 'sterilizersvendue'
        await db.collection('sterilizersvendue').add({
          ...sterilizerData,
          vendue: false,
          admin: dto.mail,
        });
      }
    }
  
    return { id: docRef.id, ...dto };
  }
  

  async updateAdmin(id: string, dto: UpdateAdminDto) {
    const db = this.firebase.db;
    const docRef = db.collection('admin').doc(id);
// 🔁 On filtre les champs `undefined` du DTO
const cleanDto: Record<string, any> = {};
Object.keys(dto).forEach(key => {
  const value = (dto as any)[key];
  if (value !== undefined) {
    cleanDto[key] = value;
  }
});

await docRef.update(cleanDto);
    return { id, ...dto };
  }

  async deleteAdmin(id: string) {
    const db = this.firebase.db;
    await db.collection('admin').doc(id).delete();
    return { message: `Admin ${id} supprimé avec succès` };
  }
}
