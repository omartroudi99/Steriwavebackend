import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FirebaseService } from '../firebase/firebase.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class SteriWaveGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SteriWaveGateway');

  constructor(private firebase: FirebaseService) {}

  afterInit() {
    const sterilizersRef = this.firebase.rtdb.ref('sterilizers'); // 🔁 RTDB

    sterilizersRef.on('value', (snapshot) => {
      const data = snapshot.val();
      this.logger.log('Realtime update received from RTDB');
      this.server.emit('sterilizersUpdated', data);
    });
  }
}
