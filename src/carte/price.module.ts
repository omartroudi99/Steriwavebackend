import { Module } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [PriceController],
  providers: [PriceService, FirebaseService],
})
export class PriceModule {}
