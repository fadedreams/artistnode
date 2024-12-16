import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import UserModel from '@src/infrastructure/persistence/models/userModel'; // Assuming Mongoose model is imported
import jwt from 'jsonwebtoken';

export class UserRepository {
    async create(userData: UserDTO) {
        console.log("UserRepositoryB  ", userData);

        // Fixed the query syntax here
        const oldUser = await UserModel.findOne({ email: userData.email });
        if (oldUser) {
            throw new Error('User already exists!');
        }

        const user = new UserModel(userData);
        await user.save();
        console.log("UserRepositoryA  ", userData);
        return user;
    }

    async signIn(signInData: SignInDTO) {
        console.log("signIn UserRepository ", signInData);

        const user = await UserModel.findOne({ email: signInData.email });
        if (!user) {
            throw new Error("User doesn't exist!");
        }

        const matched = await user.comparePassword(signInData.password);
        if (!matched) {
            throw new Error('Incorrect password!');
        }

        const { _id, name, email, role, isVerified } = user;
        const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

        console.log("signIn UserRepository UserModel", user);

        // Removed redundant password check here
        return { user: { id: _id, name, email, role, token: jwtToken, isVerified } };
    }
}

