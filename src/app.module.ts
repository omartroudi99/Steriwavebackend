import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { SteriWaveModule } from './steriwave/steriwave.module';
import { PriceModule } from './carte/price.module';
import { Tableaux2Module } from './deuxiemetableaux/tableaux2.module';
import { PremieretableauxModule } from './premieretableaux/premieretableaux.module';
import { AdminModule } from './admin/admin.module';
import { ResallerModule } from './resaller/resaller.module';
import { DeviceCommandsModule } from './device-commands/device-commands.module';
import { AuthDeviceModule } from './authdevice/authdevice.module';
import { UserDataModule } from './sterilisateurs/user-data.module';
import { HeartbeatListenerService } from './sterilisateurs/heartbeat/heartbeat-listener.service';
import { FirebaseService } from './firebase/firebase.service';
import { HeartbeatModule } from './sterilisateurs/heartbeat/heartbeat.module';
import { RoomsModule } from './salles/rooms.module';
import { ClockModule } from './horametre/clock.module';
import { CommandsModule } from './device-commands/socket/commands.module';
import { StatusModule } from './sterilisateurs/heartbeat/status.module';
import { CommandConfirmationModule } from './command-confirmation/command-confirmation.module';
import { HourMetreModule } from './hourmetrecommands/hourmetre.module';
import { HistoriqueModule } from './device-commands/testqueque/historique.module';
import { FirebaseHistoryModule } from './firebase-history/firebase-history.module';
import { UserHistoriqueModule } from './historique/user-historique.module';
import { SendMailModule } from '././device-commands/maillogs/sendmail.module';
import { CycleModule } from './sterilisateurs/cycle/cycle.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'firebase-exchange',
          type: 'direct',
        },
      ],
      uri: 'amqp://localhost',
      connectionInitOptions: { wait: true },
    }),
    SteriWaveModule,
    PriceModule,
    Tableaux2Module,
    PremieretableauxModule,
    AdminModule,
    ResallerModule,
    DeviceCommandsModule,
    AuthDeviceModule,
    UserDataModule,
    HeartbeatModule,
    RoomsModule,
    ClockModule,
    CommandsModule,
    StatusModule,
    CommandConfirmationModule,
    HourMetreModule,
    HistoriqueModule,
    UserHistoriqueModule,
    FirebaseHistoryModule,
    SendMailModule,
    CycleModule,
  ],
  providers: [FirebaseService, HeartbeatListenerService],
})
export class AppModule {}
