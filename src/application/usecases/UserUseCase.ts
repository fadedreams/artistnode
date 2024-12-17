import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import { Logger } from 'winston';
import { UserRepository } from '@src/infrastructure/persistence/repositories/user';

export class UserUseCase {
    private userRepository: UserRepository;
    private logger: Logger;

    constructor(userRepository: UserRepository, logger: Logger) {
        this.userRepository = userRepository;
        this.logger = logger;
    }

    async createUser(userData: UserDTO): Promise<any> {
        this.logger.info('UserUseCase: Creating new user', { email: userData.email });
        const user = await this.userRepository.create(userData);
        this.logger.info('UserUseCase: User created successfully', { userId: user._id });
        return user;
    }

    async signInUser(signInData: SignInDTO): Promise<any> {
        this.logger.info('UserUseCase: Signing in user', { email: signInData.email });
        const user = await this.userRepository.signIn(signInData);
        this.logger.info('UserUseCase: User signed in successfully', { userId: user.user.id });
        return user;
    }
}

