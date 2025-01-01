import {
    ArtistAvatar,
    IArtist,
    CreateArtistDTO,
    UpdateArtistDTO,
    SearchArtistDTO,
    CreateArtistResponse,
    UpdateArtistResponse,
    SearchArtistResponse,
    GetSingleArtistResponse,
    GetArtistsResponse,
    GetActorsResponse
} from '@src/domain/entities/artist';

export default interface IArtistRepository {
    createArtist(artistData: CreateArtistDTO): Promise<CreateArtistResponse>;
    updateArtist(artistId: string, artistData: UpdateArtistDTO): Promise<CreateArtistResponse>;
    removeArtist(artistId: string): Promise<{ message?: string; error?: string }>;
    searchArtist(searchCriteria: SearchArtistDTO): Promise<SearchArtistResponse>;
    getLatestArtist(): Promise<GetSingleArtistResponse>;
    getSingleArtist(artistId: string): Promise<IArtist | null>;
    getActors(): Promise<GetActorsResponse>;
}
