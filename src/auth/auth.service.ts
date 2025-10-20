import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { LoginDto } from '../steriwave/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly firebase: FirebaseService) {}

  async validateUser(dto: LoginDto) {
    const db = this.firebase.db;

    const snapshot = await db
      .collection('admin')
      .where('mail', '==', dto.email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new UnauthorizedException('Email incorrect');
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (data.mdps !== dto.password) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    return {
      statusCode: 200,
      message: 'Connexion réussie',
      role: data.etat,
      email: data.mail,
    };
  }

  // 🔹 CREATE
  async createAdmin(adminData: any) {
    const db = this.firebase.db;

    if (!adminData.mail || !adminData.mdps || !adminData.etat) {
      throw new BadRequestException('Champs requis manquants.');
    }

    const docRef = await db.collection('admin').add(adminData);
    return { id: docRef.id, ...adminData };
  }

  // 🔹 READ
  async getAllAdmins() {
    const db = this.firebase.db;
    const snapshot = await db.collection('admin').get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getAdminById(id: string) {
    const db = this.firebase.db;
    const doc = await db.collection('admin').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException(`Admin avec ID ${id} introuvable`);
    }

    return { id: doc.id, ...doc.data() };
  }

  // 🔹 UPDATE
  async updateAdmin(id: string, updateData: any) {
    const db = this.firebase.db;
    const ref = db.collection('admin').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException(`Admin avec ID ${id} introuvable`);
    }

    await ref.update(updateData);
    return { id, ...updateData };
  }

  // 🔹 DELETE
  async deleteAdmin(id: string) {
    const db = this.firebase.db;
    const ref = db.collection('admin').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException(`Admin avec ID ${id} introuvable`);
    }

    await ref.delete();
    return { message: `Admin ${id} supprimé` };
  }
}
