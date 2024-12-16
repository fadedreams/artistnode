import { Document } from 'mongoose';

export class UserDTO {
    email: string;
    password: string;
    name: string;

    constructor(email: string, password: string, name: string) {
        this.email = email;
        this.password = password;
        this.name = name;
    }
}

export class SignInDTO {
    email: string;
    password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}

// IUser interface for defining the shape of a User entity
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: 'admin' | 'user';
    comparePassword(password: string): Promise<boolean>;
}
