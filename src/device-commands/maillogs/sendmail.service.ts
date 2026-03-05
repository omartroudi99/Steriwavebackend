import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class SendMailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendMail(sourceEmail: string, to: string) {
    const response = await axios.get(
      `http://localhost:3000/historique/by-user?email=${sourceEmail}`,
    );

    const historique = response.data;

    if (!Array.isArray(historique) || historique.length === 0) {
      throw new Error("Aucun historique trouvé.");
    }

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

    return await this.transporter.sendMail(mailOptions);
  }
}