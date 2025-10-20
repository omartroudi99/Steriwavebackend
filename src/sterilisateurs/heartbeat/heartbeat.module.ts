import { Module } from '@nestjs/common';
import { HeartbeatGateway } from './heartbeat.gateway';
import { HeartbeatListenerService } from './heartbeat-listener.service';
import { FirebaseAdminModule } from '../../firebase/firebase-admin.module';

@Module({
  imports: [FirebaseAdminModule], // ✅ rend FirebaseService dispo ici
  providers: [HeartbeatGateway, HeartbeatListenerService],
  exports: [HeartbeatGateway],
})
export class HeartbeatModule {}
