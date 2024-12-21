import { UserDTO, SignInDTO, CreateUserResponse, SignInResponse } from '@src/domain/entities/user';
import UserModel from '@src/infrastructure/persistence/models/userModel'; // Assuming Mongoose model is imported
import jwt from 'jsonwebtoken';
import { Logger } from 'winston';

export class UserRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async create(userData: UserDTO): Promise<CreateUserResponse> {
        this.logger.info('UserRepository: Attempting to create user', { email: userData.email });

        try {
            const oldUser = await UserModel.findOne({ email: userData.email });
            if (oldUser) {
                this.logger.warn('UserRepository: User already exists', { email: userData.email });
                return { success: false, message: 'User already exists!' };
            }

            const user = new UserModel(userData);
            await user.save();

            this.logger.info('UserRepository: User created successfully', { userId: user._id });
            return { success: true, user };
        } catch (error) {
            this.logger.error('UserRepository: Error creating user', { error });
            return { success: false, message: 'Failed to create user' };
        }
    }

    async signIn(signInData: SignInDTO): Promise<SignInResponse> {
        this.logger.info('UserRepository: Attempting sign-in', { email: signInData.email });

        try {
            const user = await UserModel.findOne({ email: signInData.email });
            if (!user) {
                this.logger.warn("UserRepository: User doesn't exist", { email: signInData.email });
                return { success: false, message: "User doesn't exist!" };
            }

            const matched = await user.comparePassword(signInData.password);
            if (!matched) {
                this.logger.warn('UserRepository: Incorrect password', { email: signInData.email });
                return { success: false, message: 'Incorrect password!' };
            }

            const { _id, name, email, role, isVerified } = user;
            const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

            this.logger.info('UserRepository: User signed in successfully', { userId: _id });
            return {
                success: true,
                user: {
                    user: { id: _id, name, email, role, token: jwtToken, isVerified },
                },
            };
        } catch (error) {
            this.logger.error('UserRepository: Error signing in user', { error });
            return { success: false, message: 'Failed to sign in user' };
        }
    }
}
