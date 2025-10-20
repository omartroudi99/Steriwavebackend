import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

const c = {
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CommandsGateway {
  @WebSocketServer()
  server: Server;

  sendCommandAck(ack: any) {
    console.log(c.blue(`📤 EMIT commandAck →`), ack);
    this.server.emit('commandAck', ack);
  }

  sendDeviceAlert(alert: any) {
    console.log(c.blue(`📤 EMIT deviceAlert →`), alert);
    this.server.emit('deviceAlert', alert);
  }
}
