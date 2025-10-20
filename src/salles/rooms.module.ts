import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';

@Module({
  imports: [FirebaseAdminModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
