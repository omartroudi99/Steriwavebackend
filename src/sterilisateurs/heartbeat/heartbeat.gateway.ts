// src/sterilisateurs/heartbeat/heartbeat.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class HeartbeatGateway {
  @WebSocketServer() server: Server;

  // transitions explicites
  sendOnline(update: { deviceId: string; connection_type: string | null; ts: number }) {
    this.server.emit('heartbeatOnline', update);
  }

  sendOffline(update: { deviceId: string; connection_type: string | null; ts: number }) {
    this.server.emit('heartbeatOffline', update);
  }

  // (optionnel mais top) statut unifié à chaque changement
  sendStatus(update: {
    deviceId: string;
    status: 'online' | 'offline' | string;
    connection_type: string | null;
    ts: number;
  }) {
    this.server.emit('heartbeatStatus', update);
  }
}
