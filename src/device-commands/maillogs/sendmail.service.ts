import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class SendMailService {
  constructor(private configService: ConfigService) {}

  async sendMail(sourceEmail: string, to: string) {
    // 1. 🔁 Appeler l’API qui retourne l’historique
    const response = await axios.get(
      `http://localhost:3000/historique/by-user?email=${sourceEmail}`,
    );

    const historique = response.data;

    if (!Array.isArray(historique) || historique.length === 0) {
      throw new Error("Aucun historique trouvé.");
    }

    // 2. 🧾 Générer le CSV
    const csv = stringify(historique, {
      header: true,
      columns: [
        'device_id',
        'cycle_id',
        'option',
        'radius',
        'start_time',
        'end_time',
        'human_detected',
      ],
    });

    // 3. 📧 Créer le transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    // 4. ✉️ Définir le contenu du mail
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject: 'Sterilizer Usage History',
      text: 'Hello, please find attached the usage history of your sterilizers.',
      attachments: [
        {
          filename: 'history.csv',
          content: csv,
        },
      ],
    };

    return await transporter.sendMail(mailOptions);
  }
}
