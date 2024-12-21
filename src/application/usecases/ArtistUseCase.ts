import { Logger } from 'winston';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';
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
    GetArtistsResponse
} from '@src/domain/entities/artist';

export class ArtistUseCase {
    private artistRepository: ArtistRepository;
    private logger: Logger;

    constructor(artistRepository: ArtistRepository, logger: Logger) {
        this.artistRepository = artistRepository;
        this.logger = logger;
    }

    // Create Artist - Response type adjusted
    async createArtist(artistData: CreateArtistDTO): Promise<CreateArtistResponse> {
        try {
            const artist = await this.artistRepository.createArtist(artistData);
            if ('error' in artist) {
                return { success: false, error: artist.error };
            }
            // return { success: true, artist };
            return artist;
        } catch (error: unknown) {
            this.logger.error('Error creating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Update Artist - Response type adjusted
    async updateArtist(artistId: string, artistData: UpdateArtistDTO): Promise<UpdateArtistResponse> {
        try {
            const updatedArtist = await this.artistRepository.updateArtist(artistId, artistData);
            if (!updatedArtist) {
                return { success: false, error: 'Artist not found' };
            }
            return updatedArtist;
        } catch (error: unknown) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Remove Artist - Response type adjusted
    async removeArtist(artistId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const result = await this.artistRepository.removeArtist(artistId);
            if (result.error) {
                return { success: false, error: result.error };
            }
            return { success: true, message: 'Artist removed successfully' };
        } catch (error: unknown) {
            this.logger.error('Error removing artist:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Search Artist - Return type adjusted
    async searchArtist(query: SearchArtistDTO): Promise<SearchArtistResponse> {
        try {
            const artists = await this.artistRepository.searchArtist(query);
            return artists;
        } catch (error: unknown) {
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Get Latest Artists - Return type adjusted
    async getLatestArtist(): Promise<GetArtistsResponse> {
        try {
            const latestArtists = await this.artistRepository.getLatestArtist();
            return latestArtists;
        } catch (error: unknown) {
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Get Single Artist - Return type adjusted
    async getSingleArtist(artistId: string): Promise<GetSingleArtistResponse> {
        try {
            const artist = await this.artistRepository.getSingleArtist(artistId);
            if (!artist) {
                return { success: false, error: 'Artist not found' };
            }
            return { success: true, artist };
        } catch (error: unknown) {
            this.logger.error('Error fetching artist by ID:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    // Get Actors - Return type adjusted
    async getActors(): Promise<GetArtistsResponse> {
        try {
            const actors = await this.artistRepository.getActors();
            return actors;
        } catch (error: unknown) {
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }
}
