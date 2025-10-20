import { Module } from '@nestjs/common';
import { CommandsListenerService } from './commands-listener.service';
import { CommandsGateway } from './commands.gateway';
import { FirebaseService } from '../../firebase/firebase.service';

@Module({
  providers: [CommandsListenerService, CommandsGateway, FirebaseService],
  exports: [CommandsGateway],
})
export class CommandsModule {}
