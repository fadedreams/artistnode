import ArtModel from '@src/infrastructure/persistence/models/artModel';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt } from '@src/domain/entities/art';
import { Logger } from 'winston';

export class ArtRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async createArt(artData: CreateArtDTO) {
        try {
            const existingArt = await ArtModel.findOne({ title: artData.title }).lean();
            if (existingArt) {
                throw new Error('Art already exists');
            }
            const art = new ArtModel(artData);
            await art.save();
            return art;
        } catch (error) {
            this.logger.error('Error creating art:', error);
            throw error;
        }
    }

    async updateArt(artId: string, artData: UpdateArtDTO) {
        try {
            const updatedArt = await ArtModel.findByIdAndUpdate(artId, artData, { new: true });
            return updatedArt;
        } catch (error) {
            this.logger.error('Error updating art:', error);
            throw error;
        }
    }

    // Remove Art
    async removeArt(artId: string) {
        const result = await ArtModel.findByIdAndDelete(artId);
        if (!result) {
            this.logger.error('Art not found for removal:', artId); // Log error if art not found
            return { error: 'Art not found' };
        }
        this.logger.info('Art removed:', artId); // Log success message
        return { message: 'Art removed successfully' };
    }

    // Search Arts by Title or other criteria
    async searchArt(query: SearchArtDTO) {
        const { title, artist, genre } = query;
        const arts = await ArtModel.find({
            ...(title && { title: new RegExp(title, 'i') }),
            ...(artist && { artists: new RegExp(artist, 'i') }),
            ...(genre && { genre }),
        });
        this.logger.info('Search for arts completed'); // Log search completion
        return arts;
    }

    // Get Latest Arts
    async getLatestArt() {
        const latestArts = await ArtModel.find().sort({ createdAt: -1 }).limit(10);
        this.logger.info('Fetched latest arts'); // Log fetching latest arts
        return latestArts;
    }

    // Get Single Art by ID
    async getSingleArt(artId: string) {
        const art = await ArtModel.findById(artId);
        if (!art) {
            this.logger.error('Art not found:', artId); // Log error if art not found
        }
        return art;
    }

    // Get Arts with Pagination
    async getArt(pageNo: number, limit: number) {
        const skip = (pageNo - 1) * limit;
        const arts = await ArtModel.find().skip(skip).limit(limit);
        this.logger.info('Fetched paginated arts'); // Log fetching paginated arts
        return arts;
    }
}

