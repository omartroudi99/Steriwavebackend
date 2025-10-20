export class UpdateUserDto {
    userId: string;
    uidAuth: string; // Firebase Auth UID
    newEmail?: string;
    newPassword?: string;
    nometablissement?: string;
    adresse?: string;
    type?: string;
  }
  