// src/sterilisateurs/cycle/cycle.module.ts
import { Module } from '@nestjs/common';
import { FirebaseAdminModule } from '../../firebase/firebase-admin.module';
import { CycleGateway } from './cycle.gateway';
import { CycleStateListenerService } from './cycle-state-listener.service';

@Module({
  imports: [FirebaseAdminModule],
  providers: [CycleGateway, CycleStateListenerService],
  exports: [CycleGateway],
})
export class CycleModule {}
