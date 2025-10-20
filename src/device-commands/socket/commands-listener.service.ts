import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { CommandsGateway } from './commands.gateway';

const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

@Injectable()
export class CommandsListenerService implements OnModuleInit, OnModuleDestroy {
  private deviceUnsub = new Map<string, () => void>();
  private rootUnsub?: () => void;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commandsGateway: CommandsGateway,
  ) {}

  onModuleInit() {
    const devicesRef = this.firebaseService.rtdb.ref('steriwave/devices');

    // 1) Abonner les devices déjà présents
    devicesRef.once('value', (snap) => {
      const devices = snap.val() ?? {};
      const ids = Object.keys(devices);
      console.log(c.cyan(`📡 Listener racine: ${ids.length} device(s) initial(s)`));
      ids.forEach((deviceId) => this.attachDeviceListener(deviceId));
    });

    // 2) Écouter l’arrivée de nouveaux devices
    const onAdded = devicesRef.on('child_added', (snap) => {
      const deviceId = snap.key!;
      console.log(c.cyan(`➕ Nouveau device détecté: ${deviceId}`));
      this.attachDeviceListener(deviceId);
    });

    // 3) Détacher quand un device disparaît
    const onRemoved = devicesRef.on('child_removed', (snap) => {
      const deviceId = snap.key!;
      console.log(c.yellow(`➖ Device supprimé: ${deviceId}`));
      this.detachDeviceListener(deviceId);
    });

    // garder une fonction d’unsubscribe pour la racine
    this.rootUnsub = () => {
      devicesRef.off('child_added', onAdded);
      devicesRef.off('child_removed', onRemoved);
    };

    console.log(c.cyan('📡 Listener racine activé sur steriwave/devices'));
  }

  onModuleDestroy() {
    // Clean listeners
    if (this.rootUnsub) this.rootUnsub();
    for (const deviceId of this.deviceUnsub.keys()) {
      this.detachDeviceListener(deviceId);
    }
    console.log(c.gray('🧹 Listeners nettoyés (module destroy)'));
  }
  private attachDeviceListener(deviceId: string) {
    if (this.deviceUnsub.has(deviceId)) return; 
    const confRef = this.firebaseService.rtdb.ref(
      `steriwave/devices/${deviceId}/commands/confirmation`,
    );
    const onConfAdded = confRef.on('child_added', (snap) => {
      this.processConfirmationSnap(deviceId, snap);
    });
    const onConfChanged = confRef.on('child_changed', (snap) => {
      this.processConfirmationSnap(deviceId, snap);
    });
    const alertRef = this.firebaseService.rtdb.ref(
      `steriwave/devices/${deviceId}/alert`
    );
    const onAlertValue = alertRef.on('value', (snap) => {
      const payload = snap.val(); 
      this.handleAlert(deviceId, payload);
    });
    const onAlertChanged = alertRef.on('child_changed', (_) => {
      alertRef.once('value', (s) => this.handleAlert(deviceId, s.val()));
    });
    this.deviceUnsub.set(deviceId, () => {
      confRef.off('child_added', onConfAdded);
      confRef.off('child_changed', onConfChanged);
      alertRef.off('value', onAlertValue);
      alertRef.off('child_changed', onAlertChanged);
    });

    console.log(c.cyan(`📡 Listener activé: /devices/${deviceId}/commands/confirmation & /alert`));
  }

  private detachDeviceListener(deviceId: string) {
    const unsub = this.deviceUnsub.get(deviceId);
    if (unsub) {
      unsub();
      this.deviceUnsub.delete(deviceId);
      console.log(c.yellow(`🛑 Listener détaché: /devices/${deviceId}/commands/confirmation & /alert`));
    }
  }
  private normalizeCommandKey(raw: string): string {
    if (!raw) return '';
    const s = raw
      .replace(/[:_]/g, ' ')  
      .toLowerCase()          
      .trim()                 
      .replace(/\s+/g, ' ');   

    // Mapping léger de synonymes si jamais l'IoT varie
    const map: Record<string, string> = {
      'cycle start': 'cycle started',
      'start cycle': 'cycle started',
      'cycle pause': 'cycle paused',
      'pause cycle': 'cycle paused',
      'cycle resume': 'cycle resumed',
      'resume cycle': 'cycle resumed',
      'cycle stop': 'cycle stopped',
      'stop cycle': 'cycle stopped',
    };

    return map[s] ?? s;
  }
  private normalizeStatus(val: any): number {
    if (val == null) return 0;

    if (typeof val === 'number') return val;

    if (typeof val === 'string') {
      const m = val.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    }

    if (typeof val === 'object') {
      // tolérer { status: 200 } ou { code: "200" }...
      if ('status' in val) return this.normalizeStatus((val as any).status);
      if ('code' in val)   return this.normalizeStatus((val as any).code);
    }

    return 0;
  }

  // Traite un snapshot de confirmation (child_added / child_changed)
// ⬇️ ajoute "async"
private async processConfirmationSnap(deviceId: string, snap: any) {
  const origKey = (snap?.key ?? '').toString();        // <-- garde la clé exacte pour delete
  const rawVal =
    typeof snap?.val === 'function' ? snap.val() : (snap as any)?.val;

  const command = this.normalizeCommandKey(origKey);
  const status  = this.normalizeStatus(rawVal);

  if (!command) {
    console.warn(c.yellow(`⚠️ ${deviceId} • Confirmation ignorée: clé invalide ->`), origKey);
    return;
  }

  console.log(c.green(`✅ ${deviceId} • Confirmation reçue : [${command}] = ${status}`));

  // 1) émettre vers le front
  this.commandsGateway.sendCommandAck({
    deviceId,
    command,
    status,
    ts: Date.now(),
  });

  // 2) supprimer la confirmation traitée (purement côté backend)
  await this.purgeConfirmation(deviceId, origKey);
}
private async purgeConfirmation(deviceId: string, origKey: string) {
  const path = `steriwave/devices/${deviceId}/commands/confirmation/${origKey}`;
  try {
    await this.firebaseService.rtdb.ref(path).remove();  // ou .set(null)
    console.log(c.gray(`🧽 Purge confirmation OK: ${path}`));
  } catch (err) {
    console.error(`❌ Purge confirmation FAIL: ${path}`, err);
  }
}

  // (facultatif) garde handleChange pour compat éventuelle
  private handleChange(deviceId: string, command: string, status: any) {
    const fakeSnap = { key: command, val: () => status };
    this.processConfirmationSnap(deviceId, fakeSnap as any);
  }

  // -------------------------------
  // Alerts
  // -------------------------------
  private handleAlert(deviceId: string, payload: any) {
    // Le device peut envoyer un objet ou (rarement) une string.
    let alert = '';
    let cycleId = '';
    let message = '';

    if (payload && typeof payload === 'object') {
      // tolérer snake_case / camelCase
      alert   = (payload.alert ?? payload.Alert ?? '').toString().trim();
      cycleId = (payload.cycle_id ?? payload.cycleId ?? '').toString().trim();
      message = (payload.message ?? payload.msg ?? '').toString().trim();
    } else if (typeof payload === 'string') {
      alert = payload.trim();
    }

    if (!alert) return; // pas d'info utile → ne rien logguer

    console.log(c.red(`🚨 ALERT • Device=${deviceId} • Alert=${alert} • CycleId=${cycleId} • Message=${message}`));

    this.commandsGateway.sendDeviceAlert({
      deviceId,
      alert,     // ex: "human_detected"
      cycleId,
      message,
      ts: Date.now(),
    });
  }
}
