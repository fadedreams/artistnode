// src/domain/repositories/user.ts
import { IUser } from '@src/domain/entities/user';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';

export interface IUserRepository {
    create(user: UserDTO): Promise<IUser>;
    signIn(user: SignInDTO): Promise<IUser>;
    // findByEmail(email: string): Promise<IUser | null>;
    // findById(id: string): Promise<IUser | null>;
    // update(id: string, user: Partial<IUser>): Promise<IUser>;
    // delete(id: string): Promise<void>;
    // Additional methods can be added based on your needs
}


