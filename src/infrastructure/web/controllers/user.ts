import { Request, Response } from 'express';
import { UserUseCase } from '@src/application/usecases/UserUseCase';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import { UserRepository } from '@src/infrastructure/persistence/repositories/user';
import { Logger } from 'winston';

export class UserController {
    private userUseCase: UserUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        const userRepository = new UserRepository();
        this.userUseCase = new UserUseCase(userRepository);
        this.logger = logger;
    }

    public create = async (req: Request, res: Response) => {
        const userData: UserDTO = req.body;

        try {
            this.logger.info('Creating a new user', { data: userData });
            const user = await this.userUseCase.createUser(userData);
            res.status(201).json(user);
        } catch (error: unknown) {
            this.logger.error('Error creating user', { error });

            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(400).json({ error: 'An unknown error occurred' });
            }
        }
    };

    public signIn = async (req: Request, res: Response) => {
        const signInData: SignInDTO = req.body;

        try {
            this.logger.info('User sign-in attempt', { data: signInData });
            const user = await this.userUseCase.signInUser(signInData);
            res.status(200).json(user);
        } catch (error: unknown) {
            this.logger.error('Error signing in user', { error });

            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(400).json({ error: 'An unknown error occurred' });
            }
        }
    };
}

