import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { IArt } from '@src/domain/entities/art';
import { Logger } from 'winston';

export class ArtUseCase {
    private artRepository: ArtRepository;
    private logger: Logger;

    constructor(artRepository: ArtRepository, logger: Logger) {
        this.artRepository = artRepository;
        this.logger = logger;
    }

    // Create Art
    async createArt(artData: any) {  // Replace CreateArtDTO with 'any' or appropriate type
        try {
            const art = await this.artRepository.createArt(artData);
            return { success: true, art };
        } catch (error: unknown) {
            this.logger.error('Error creating art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
        }
    }

    // Update Art
    async updateArt(artId: string, artData: any) {  // Replace UpdateArtDTO with 'any' or appropriate type
        try {
            const updatedArt = await this.artRepository.updateArt(artId, artData);
            return { success: true, updatedArt };
        } catch (error: unknown) {
            this.logger.error('Error updating art:', error instanceof Error ? error.message : 'Unknown error');
            return { error: 'An unknown error occurred' };
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

