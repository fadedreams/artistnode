export default interface IArtistController {
    createArtist(req: Request, res: Response): Promise<Response>;
    updateArtist(req: Request, res: Response): Promise<Response>;
    removeArtist(req: Request, res: Response): Promise<Response>;
    searchArtist(req: Request, res: Response): Promise<Response>;
    getLatestArtist(req: Request, res: Response): Promise<Response>;
    getSingleArtist(req: Request, res: Response): Promise<Response>;
    getActors(req: Request, res: Response): Promise<Response>;
}
