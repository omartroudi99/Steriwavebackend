import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class CycleGateway {
  @WebSocketServer() server: Server;

  sendCycleState(update: { deviceId: string; sterilization_active: boolean; ts: number }) {
    console.log('🚀 [CycleGateway] emit cycleState →', update);
    this.server.emit('cycleState', update);
  }
}
