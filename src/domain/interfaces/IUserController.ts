import { Request, Response } from 'express';
import { UserDTO, SignInDTO } from '@src/domain/entities/user';

export default interface IUserController {
    create(req: Request, res: Response): Promise<Response>;
    signIn(req: Request, res: Response): Promise<Response>;
}
