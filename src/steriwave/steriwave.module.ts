import { Module } from '@nestjs/common';
import { SteriWaveService } from './steriwave.service';
import { SteriWaveController } from './steriwave.controller';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthModule } from '../auth/auth.module';
import { SteriWaveGateway } from './steriwave.gateway';

@Module({
  imports: [AuthModule],
  controllers: [SteriWaveController],
  providers: [SteriWaveService, FirebaseService, SteriWaveGateway],
})
export class SteriWaveModule {}