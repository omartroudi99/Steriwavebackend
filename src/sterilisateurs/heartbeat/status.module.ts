import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { FirebaseAdminModule } from '../../firebase/firebase-admin.module';

@Module({
  imports: [FirebaseAdminModule], // ✅ pour injecter FirebaseService dans StatusController
  controllers: [StatusController],
})
export class StatusModule {}
