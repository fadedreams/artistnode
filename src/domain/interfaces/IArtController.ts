import { Request, Response } from 'express';

export default interface IArtController {
    createArt(req: Request, res: Response): Promise<Response>;
    updateArt(req: Request, res: Response): Promise<Response>;
    removeArt(req: Request, res: Response): Promise<Response>;
    searchArt(req: Request, res: Response): Promise<Response>;
    getLatestArt(req: Request, res: Response): Promise<Response>;
    getSingleArt(req: Request, res: Response): Promise<Response>;
    getArt(req: Request, res: Response): Promise<Response>;
}
