import { Request, Response } from 'express';
import { UserUseCase } from '@src/application/usecases/UserUseCase';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';
import { UserRepository } from '@src/infrastructure/persistence/repositories/user';
import { Logger } from 'winston';

export class UserController {
    private userUseCase: UserUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;

        // Initialize repository and use case with logger
        const userRepository = new UserRepository(this.logger);
        this.userUseCase = new UserUseCase(userRepository, this.logger);
    }

    public create = async (req: Request, res: Response): Promise<Response> => {
        const userData: UserDTO = req.body;

        try {
            this.logger.info('UserController: Received request to create user', { email: userData.email });
            const user = await this.userUseCase.createUser(userData);
            return res.status(201).json(user); // Return the response
        } catch (error: unknown) {
            this.logger.error('UserController: Error creating user', { error });
            return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' }); // Return the response
        }
    };

    public signIn = async (req: Request, res: Response): Promise<Response> => {
        const signInData: SignInDTO = req.body;

        try {
            this.logger.info('UserController: Received request to sign in user', { email: signInData.email });
            const user = await this.userUseCase.signInUser(signInData);
            return res.status(200).json(user); // Return the response
        } catch (error: unknown) {
            this.logger.error('UserController: Error signing in user', { error });
            return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' }); // Return the response
        }
    };
}
