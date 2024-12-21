import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { Logger } from 'winston';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt, CreateArtResponse, UpdatedArtResponse, SearchArtResponse, GetLatestArtResponse, GetArtResponse } from '@src/domain/entities/art';

export class ArtUseCase {
    private artRepository: ArtRepository;
    private logger: Logger;

    constructor(artRepository: ArtRepository, logger: Logger) {
        this.artRepository = artRepository;
        this.logger = logger;
    }

    async createArt(artData: CreateArtDTO): Promise<CreateArtResponse> {
        try {
            const createdArt = await this.artRepository.createArt(artData);
            return { success: true, art: createdArt };
        } catch (error) {
            this.logger.error('Error creating art:', error);
            return { success: false, error: 'Error creating art' };
        }
    }

    async updateArt(artId: string, artData: UpdateArtDTO): Promise<UpdatedArtResponse> {
        try {
            const updatedArt = await this.artRepository.updateArt(artId, artData);
            return { success: true, updatedArt };
        } catch (error) {
            this.logger.error('Error updating art:', error);
            return { success: false, error: 'Error updating art' };
        }
    }

    async removeArt(artId: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const result = await this.artRepository.removeArt(artId);
            return { success: true, message: result.message };
        } catch (error) {
            this.logger.error('Error removing art:', error);
            return { success: false, error: 'Error removing art' };
        }
    }

    async searchArt(query: SearchArtDTO): Promise<SearchArtResponse> {
        try {
            const arts = await this.artRepository.searchArt(query);
            return { success: true, arts };
        } catch (error) {
            this.logger.error('Error searching art:', error);
            return { success: false, error: 'Error searching art' };
        }
    }

    async getLatestArt(): Promise<GetLatestArtResponse> {
        try {
            const latestArts = await this.artRepository.getLatestArt();
            return { success: true, latestArts };
        } catch (error) {
            this.logger.error('Error fetching latest art:', error);
            return { success: false, error: 'Error fetching latest art' };
        }
    }


    async getSingleArt(artId: string): Promise<GetArtResponse> {
        try {
            const art = await this.artRepository.getSingleArt(artId);
            if (!art) {
                return { success: false, error: 'Art not found' };
            }
            return { success: true, arts: [art] };  // Wrap the single art in an array to match the GetArtResponse structure
        } catch (error) {
            this.logger.error('Error fetching art by ID:', error);
            return { success: false, error: 'Error fetching art by ID' };
        }
    }

    async getArt(pageNo: number, limit: number): Promise<GetArtResponse> {
        try {
            const arts = await this.artRepository.getArt(pageNo, limit);
            return { success: true, arts };
        } catch (error) {
            this.logger.error('Error fetching art:', error);
            return { success: false, error: 'Error fetching art' };
        }
    }
}
