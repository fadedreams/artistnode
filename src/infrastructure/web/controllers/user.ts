import { Request, Response } from 'express';
import { UserUseCase } from '@src/application/usecases/UserUseCase';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import { UserRepository } from '@src/infrastructure/persistence/repositories/user';

const userRepository = new UserRepository();
const userUseCase = new UserUseCase(userRepository);

export const create = async (req: Request, res: Response) => {
    const userData: UserDTO = req.body;
    try {
        const user = await userUseCase.createUser(userData);
        res.status(201).json(user);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            // Handle unknown error
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
};

export const signIn = async (req: Request, res: Response) => {

    const signInData: SignInDTO = req.body;
    console.log("signIn controllers ", signInData)
    try {
        const user = await userUseCase.signInUser(signInData);
        res.status(200).json(user);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            // Handle unknown error
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
};

