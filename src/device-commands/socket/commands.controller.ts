import { Controller, Post, Body, Param } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Controller('commands')
export class CommandsController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post(':deviceId/test')
  async pushCommandToDevice(
    @Param('deviceId') deviceId: string,
    @Body() body: { command: string; status: number; message: string },
  ) {
    const { command, status, message } = body;
    const ref = this.firebaseService.rtdb.ref(
      `steriwave/devices/${deviceId}/commands/${command}`,
    );
    await ref.set({ status, message, timestamp: new Date().toISOString() });
    console.log('🧪 Test push →', { deviceId, command, status, message });
    return { success: true, deviceId, sent: body };
  }
}
