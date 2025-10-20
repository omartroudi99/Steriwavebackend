import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { FirebaseService } from '../firebase/firebase.service'; // ✅ juste importer le service

@Module({
  providers: [AdminService, FirebaseService], // ✅ ajouter ici
  controllers: [AdminController],
})
export class AdminModule {}
