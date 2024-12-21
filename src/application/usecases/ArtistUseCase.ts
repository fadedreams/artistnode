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

    async createArtist(artistData: CreateArtistDTO): Promise<{ success: boolean; artist?: IArtist; error?: string }> {
        try {
            const artist = await this.artistRepository.createArtist(artistData);
            if ('error' in artist) {
                return { success: false, error: artist.error };
            }
            return { success: true, artist };
        } catch (error: unknown) {
            this.logger.error('Error creating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    async updateArtist(artistId: string, artistData: UpdateArtistDTO): Promise<{ success: boolean; updatedArtist?: IArtist; error?: string }> {
        try {
            const updatedArtist = await this.artistRepository.updateArtist(artistId, artistData);
            if (!updatedArtist) {
                return { success: false, error: 'Artist not found' };
            }
            return { success: true, updatedArtist };
        } catch (error: unknown) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

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

    async searchArtist(query: SearchArtistDTO): Promise<{ success: boolean; artists?: IArtist[]; error?: string }> {
        try {
            const artists = await this.artistRepository.searchArtist(query);
            return { success: true, artists };
        } catch (error: unknown) {
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    async getLatestArtist(): Promise<{ success: boolean; latestArtists?: IArtist[]; error?: string }> {
        try {
            const latestArtists = await this.artistRepository.getLatestArtist();
            return { success: true, latestArtists };
        } catch (error: unknown) {
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }

    async getSingleArtist(artistId: string): Promise<{ success: boolean; artist?: IArtist; error?: string }> {
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

    async getActors(): Promise<{ success: boolean; actors?: IArtist[]; error?: string }> {
        try {
            const actors = await this.artistRepository.getActors();
            return { success: true, actors };
        } catch (error: unknown) {
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: 'An unknown error occurred' };
        }
    }
}
