export class CreateUserDto {
    name: string;
    email: string;
    mdps: string;
    nometablissement: string;
    adresse: string;
    type: string;
    admin: string;
    selectedSterilizers: {
      deviceId: string;
      price: string;
    }[];
  }
  