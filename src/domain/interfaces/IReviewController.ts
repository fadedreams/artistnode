import { Request, Response } from 'express';

export default interface IReviewController {
    addReview(req: Request, res: Response): Promise<Response>;
    updateReview(req: Request, res: Response): Promise<Response>;
    removeReview(req: Request, res: Response): Promise<Response>;
    getReviewsByArt(req: Request, res: Response): Promise<Response>;
}
