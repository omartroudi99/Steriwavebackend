import { Module } from '@nestjs/common';
import { Tableaux2Controller } from './tableaux2.controller';
import { Tableaux2Service } from './tableaux2.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [Tableaux2Controller],
  providers: [Tableaux2Service, FirebaseService],
})
export class Tableaux2Module {}
