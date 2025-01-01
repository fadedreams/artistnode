import { UserDTO, SignInDTO, CreateUserResponse, SignInResponse } from '@src/domain/entities/user';

export default interface IUserRepository {
    create(userData: UserDTO): Promise<CreateUserResponse>;
    signIn(signInData: SignInDTO): Promise<SignInResponse>;
}
