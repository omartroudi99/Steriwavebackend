import { Controller, Post, Body } from '@nestjs/common';
import { SendMailService } from './sendmail.service';

@Controller('sendmail')
export class SendMailController {
  constructor(private sendMailService: SendMailService) {}

@Post()
async send(@Body() body: { sourceEmail: string; to: string }) {
  return this.sendMailService.sendMail(body.sourceEmail, body.to);
}

}
