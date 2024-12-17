import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import UserModel from '@src/infrastructure/persistence/models/userModel'; // Assuming Mongoose model is imported
import jwt from 'jsonwebtoken';
import { Logger } from 'winston';

export class UserRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async create(userData: UserDTO) {
        this.logger.info('UserRepository: Attempting to create user', { email: userData.email });

        const oldUser = await UserModel.findOne({ email: userData.email });
        if (oldUser) {
            this.logger.warn('UserRepository: User already exists', { email: userData.email });
            throw new Error('User already exists!');
        }

        const user = new UserModel(userData);
        await user.save();

        this.logger.info('UserRepository: User created successfully', { userId: user._id });
        return user;
    }

    async signIn(signInData: SignInDTO) {
        this.logger.info('UserRepository: Attempting sign-in', { email: signInData.email });

        const user = await UserModel.findOne({ email: signInData.email });
        if (!user) {
            this.logger.warn("UserRepository: User doesn't exist", { email: signInData.email });
            throw new Error("User doesn't exist!");
        }

        const matched = await user.comparePassword(signInData.password);
        if (!matched) {
            this.logger.warn('UserRepository: Incorrect password', { email: signInData.email });
            throw new Error('Incorrect password!');
        }

        const { _id, name, email, role, isVerified } = user;
        const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

        this.logger.info('UserRepository: User signed in successfully', { userId: _id });
        return { user: { id: _id, name, email, role, token: jwtToken, isVerified } };
    }
}

