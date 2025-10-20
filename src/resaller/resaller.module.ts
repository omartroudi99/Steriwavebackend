import { Module } from '@nestjs/common';
import { ResallerController } from './resaller.controller';
import { ResallerService } from './resaller.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [ResallerController],
  providers: [ResallerService, FirebaseService],
})
export class ResallerModule {}
