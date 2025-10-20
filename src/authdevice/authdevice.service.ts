import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';

interface FirebaseLoginResponse {
  idToken: string;
  localId: string;
  email: string;
}

@Injectable()
export class AuthDeviceService {
private apiKey = 'AIzaSyA_E3ab20crSklUFZ4SwcW4nOLJQqNthu0';

  async login(dto: LoginDto) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;

    try {
      const response = await axios.post<FirebaseLoginResponse>(url, {
        email: dto.email,
        password: dto.password,
        returnSecureToken: true,
      });

      return {
        message: 'Login successful',
        token: response.data.idToken,
        uid: response.data.localId,
        email: response.data.email,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
