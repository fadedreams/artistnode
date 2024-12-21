import ArtModel from '@src/infrastructure/persistence/models/artModel';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt } from '@src/domain/entities/art';
import { Logger } from 'winston';

export class ArtRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async createArt(artData: CreateArtDTO): Promise<IArt> {
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

    async updateArt(artId: string, artData: UpdateArtDTO): Promise<IArt | null> {
        try {
            const updatedArt = await ArtModel.findByIdAndUpdate(artId, artData, { new: true });
            return updatedArt;
        } catch (error) {
            this.logger.error('Error updating art:', error);
            throw error;
        }
    }

    async removeArt(artId: string): Promise<{ message: string }> {
        const result = await ArtModel.findByIdAndDelete(artId);
        if (!result) {
            this.logger.error('Art not found for removal:', artId);
            throw new Error('Art not found');
        }
        this.logger.info('Art removed:', artId);
        return { message: 'Art removed successfully' };
    }

    async searchArt(query: SearchArtDTO): Promise<IArt[]> {
        const { title, artist, genre } = query;
        const arts = await ArtModel.find({
            ...(title && { title: new RegExp(title, 'i') }),
            ...(artist && { artists: new RegExp(artist, 'i') }),
            ...(genre && { genre }),
        });
        this.logger.info('Search for arts completed');
        return arts;
    }

    async getLatestArt(): Promise<IArt[]> {
        const latestArts = await ArtModel.find().sort({ createdAt: -1 }).limit(10);
        this.logger.info('Fetched latest arts');
        return latestArts;
    }

    async getSingleArt(artId: string): Promise<IArt | null> {
        const art = await ArtModel.findById(artId);
        if (!art) {
            this.logger.error('Art not found:', artId);
        }
        return art;
    }

    async getArt(pageNo: number, limit: number): Promise<IArt[]> {
        const skip = (pageNo - 1) * limit;
        const arts = await ArtModel.find().skip(skip).limit(limit);
        this.logger.info('Fetched paginated arts');
        return arts;
    }
}
