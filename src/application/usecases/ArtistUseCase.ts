import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';

export class ArtistUseCase {
    private artistRepository: ArtistRepository;

    constructor(artistRepository: ArtistRepository) {
        this.artistRepository = artistRepository;
    }

    async createArtist(artistData: CreateArtistDTO) {
        try {
            const artist = await this.artistRepository.createArtist(artistData);
            return { success: true, artist }; // Wrap the response in a success object
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async updateArtist(artistId: string, artistData: UpdateArtistDTO) {
        return await this.artistRepository.updateArtist(artistId, artistData);
    }

    async removeArtist(artistId: string) {
        return await this.artistRepository.removeArtist(artistId);
    }

    async searchArtist(query: SearchArtistDTO) {
        return await this.artistRepository.searchArtist(query);
    }

    async getLatestArtist() {
        return await this.artistRepository.getLatestArtist();
    }

    async getSingleArtist(artistId: string) {
        return await this.artistRepository.getSingleArtist(artistId);
    }

    async getActors() {
        return await this.artistRepository.getActors();
    }
}

