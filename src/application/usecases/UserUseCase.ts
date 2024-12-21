import { UserDTO, SignInDTO, CreateUserResponse, SignInResponse, CreateUserResponseError } from '@src/domain/entities/user';
import { Logger } from 'winston';
import { UserRepository } from '@src/infrastructure/persistence/repositories/user';

export class UserUseCase {
    private userRepository: UserRepository;
    private logger: Logger;

    constructor(userRepository: UserRepository, logger: Logger) {
        this.userRepository = userRepository;
        this.logger = logger;
    }

    // async createUser(userData: UserDTO): Promise<CreateUserResponse> {
    //     this.logger.info('UserUseCase: Creating new user', { email: userData.email });
    //     const response = await this.userRepository.create(userData);
    //
    //     if (response.success) {
    //         this.logger.info('UserUseCase: User created successfully', { userId: response.user._id });
    //     } else {
    //         // Use a type guard to narrow the type
    //         const errorResponse = response as CreateUserResponseError;
    //         this.logger.warn('UserUseCase: Failed to create user', { message: errorResponse.message });
    //     }
    //
    //     return response;
    // }

    async createUser(userData: UserDTO): Promise<CreateUserResponse> {
        this.logger.info('UserUseCase: Creating new user', { email: userData.email });
        const response = await this.userRepository.create(userData);

        if (response.success) {
            this.logger.info('UserUseCase: User created successfully', { userId: response.user._id });
        } else if ('message' in response) {
            this.logger.warn('UserUseCase: Failed to create user', { message: response.message });
        }

        return response;
    }

    async signInUser(signInData: SignInDTO): Promise<SignInResponse> {
        this.logger.info('UserUseCase: Signing in user', { email: signInData.email });
        const response = await this.userRepository.signIn(signInData);

        if (response.success) {
            this.logger.info('UserUseCase: User signed in successfully', { userId: response.user.user.id });
        } else if ('message' in response) {
            this.logger.warn('UserUseCase: Failed to sign in user', { message: response.message });
        }

        return response;
    }
}
