import ArtModel from '@src/infrastructure/persistence/models/artModel';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, IArt } from '@src/domain/entities/art';
import { Logger } from 'winston';
import IArtRepository from '@src/domain/interfaces/IArtRepository';

export class ArtRepository implements IArtRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    private transformArtDoc(artDoc: any): IArt {
        // Convert the MongoDB document to IArt, handling the _id field
        return {
            _id: artDoc._id.toString(),  // Convert ObjectId to string
            title: artDoc.title,
            director: artDoc.director,
            releaseDate: artDoc.releaseDate,
            status: artDoc.status,
            type: artDoc.type,
            artcats: artDoc.artcats,
            tags: artDoc.tags,
            artists: artDoc.artists,
            writers: artDoc.writers,
            poster: artDoc.poster,
            reviews: artDoc.reviews,
            createdAt: artDoc.createdAt,
            updatedAt: artDoc.updatedAt,
        };
    }

    async createArt(artData: CreateArtDTO): Promise<IArt> {
        try {
            const existingArt = await ArtModel.findOne({ title: artData.title }).lean();
            if (existingArt) {
                throw new Error('Art already exists');
            }
            const art = new ArtModel(artData);
            await art.save();
            return this.transformArtDoc(art);  // Transform the document to IArt
        } catch (error) {
            this.logger.error('Error creating art:', error);
            throw error;
        }
    }

    async updateArt(artId: string, artData: UpdateArtDTO): Promise<IArt | null> {
        try {
            const updatedArt = await ArtModel.findByIdAndUpdate(artId, artData, { new: true }).lean();
            return updatedArt ? this.transformArtDoc(updatedArt) : null;  // Transform the document
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
        }).lean();
        this.logger.info('Search for arts completed');
        return arts.map(this.transformArtDoc);  // Map to IArt
    }

    async getLatestArt(): Promise<IArt[]> {
        const latestArts = await ArtModel.find().sort({ createdAt: -1 }).limit(10).lean();
        this.logger.info('Fetched latest arts');
        return latestArts.map(this.transformArtDoc);  // Map to IArt
    }

    async getSingleArt(artId: string): Promise<IArt | null> {
        const art = await ArtModel.findById(artId).lean();
        if (!art) {
            this.logger.error('Art not found:', artId);
        }
        return art ? this.transformArtDoc(art) : null;  // Transform the document
    }

    async getArt(pageNo: number, limit: number): Promise<IArt[]> {
        const skip = (pageNo - 1) * limit;
        const arts = await ArtModel.find().skip(skip).limit(limit).lean();
        this.logger.info('Fetched paginated arts');
        return arts.map(this.transformArtDoc);  // Map to IArt
    }
}
