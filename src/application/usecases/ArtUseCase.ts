import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { Logger } from 'winston';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt, UpdatedArtResponse, ArtUpdateResult } from '@src/domain/entities/art';

export class ArtUseCase {
    private artRepository: ArtRepository;
    private logger: Logger;

    constructor(artRepository: ArtRepository, logger: Logger) {
        this.artRepository = artRepository;
        this.logger = logger;
    }

    async createArt(artData: CreateArtDTO) {
        try {
            return await this.artRepository.createArt(artData);
        } catch (error) {
            this.logger.error('Error creating art:', error);
            throw error;
        }
    }

    async updateArt(artId: string, artData: UpdateArtDTO) {
        try {
            return await this.artRepository.updateArt(artId, artData);
        } catch (error) {
            this.logger.error('Error updating art:', error);
            throw error;
        }
    }

    // Remove Art
    async removeArt(artId: string) {
        try {
            const result = await this.artRepository.removeArt(artId);
            return { success: true, message: 'Art removed successfully', result };
        } catch (error: unknown) {
            this.logger.error('Error removing art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Search Art
    async searchArt(query: any) {  // Replace SearchArtDTO with 'any' or appropriate type
        try {
            const arts = await this.artRepository.searchArt(query);
            return { success: true, arts };
        } catch (error: unknown) {
            this.logger.error('Error searching art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Latest Art
    async getLatestArt() {
        try {
            const latestArts = await this.artRepository.getLatestArt();
            return { success: true, latestArts };
        } catch (error: unknown) {
            this.logger.error('Error fetching latest art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Single Art by ID
    async getSingleArt(artId: string) {
        try {
            const art = await this.artRepository.getSingleArt(artId);
            return { success: true, art };
        } catch (error: unknown) {
            this.logger.error('Error fetching art by ID:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Get Arts with Pagination
    async getArt(pageNo: number, limit: number) {
        try {
            const arts = await this.artRepository.getArt(pageNo, limit);
            return { success: true, arts };
        } catch (error: unknown) {
            this.logger.error('Error fetching art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }
}

