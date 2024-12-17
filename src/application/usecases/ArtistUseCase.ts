import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';
import { Logger } from 'winston';

export class ArtistUseCase {
    private artistRepository: ArtistRepository;
    private logger: Logger;

    constructor(artistRepository: ArtistRepository, logger: Logger) {
        this.artistRepository = artistRepository;
        this.logger = logger;
    }

    async createArtist(artistData: CreateArtistDTO) {
        try {
            const artist = await this.artistRepository.createArtist(artistData);
            return { success: true, artist };
        } catch (error: unknown) {
            this.logger.error('Error creating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async updateArtist(artistId: string, artistData: UpdateArtistDTO) {
        try {
            const updatedArtist = await this.artistRepository.updateArtist(artistId, artistData);
            return { success: true, updatedArtist };
        } catch (error: unknown) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async removeArtist(artistId: string) {
        try {
            const result = await this.artistRepository.removeArtist(artistId);
            return { success: true, message: 'Artist removed successfully', result };
        } catch (error: unknown) {
            this.logger.error('Error removing artist:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async searchArtist(query: SearchArtistDTO) {
        try {
            const artists = await this.artistRepository.searchArtist(query);
            return { success: true, artists };
        } catch (error: unknown) {
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async getLatestArtist() {
        try {
            const latestArtists = await this.artistRepository.getLatestArtist();
            return { success: true, latestArtists };
        } catch (error: unknown) {
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async getSingleArtist(artistId: string) {
        try {
            const artist = await this.artistRepository.getSingleArtist(artistId);
            return { success: true, artist };
        } catch (error: unknown) {
            this.logger.error('Error fetching artist by ID:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    async getActors() {
        try {
            const actors = await this.artistRepository.getActors();
            return { success: true, actors };
        } catch (error: unknown) {
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }
}

