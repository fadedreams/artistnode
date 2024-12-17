import { IUserRepository } from '@src/domain/repositories/user';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';

export class UserUseCase {
    // private userRepository: IUserRepository;
    private userRepository;

    // constructor(userRepository: IUserRepository) {
    constructor(userRepository: any) {
        this.userRepository = userRepository;
    }

    async createUser(userData: UserDTO): Promise<any> {
        // Perform any domain logic and validation here
        const user = await this.userRepository.create(userData);
        return user;
    }

    async signInUser(signInData: SignInDTO): Promise<any> {
        // Sign in logic, like verifying password, etc.
        console.log("signIn UserUseCase ", signInData)

        const user = await this.userRepository.signIn(signInData);
        return user;
    }
}

