import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import UserModel from '@src/infrastructure/persistence/models/userModel'; // Assuming Mongoose model is imported

export class UserRepository {
    async create(userData: UserDTO) {
        console.log("UserRepositoryB  ", userData)
        const user = new UserModel(userData);
        await user.save();
        console.log("UserRepositoryA  ", userData)
        return user;
    }

    async signIn(signInData: SignInDTO) {
        const user = await UserModel.findOne({ email: signInData.email });
        if (!user || user.password !== signInData.password) {
            throw new Error('Invalid credentials');
        }
        return user;
    }
}

