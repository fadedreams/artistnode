import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt } from '@src/domain/entities/art';

export default interface IArtRepository {
    createArt(artData: CreateArtDTO): Promise<IArt>;
    updateArt(artId: string, artData: UpdateArtDTO): Promise<IArt | null>;
    removeArt(artId: string): Promise<{ message: string }>;
    searchArt(query: SearchArtDTO): Promise<IArt[]>;
    getLatestArt(): Promise<IArt[]>;
    getSingleArt(artId: string): Promise<IArt | null>;
    getArt(pageNo: number, limit: number): Promise<IArt[]>;
}
