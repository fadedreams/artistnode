import ArtistModel from '@src/infrastructure/persistence/models/artistModel';
import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { Logger } from 'winston';

export class ArtistRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    // Create Artist
    async createArtist(artistData: CreateArtistDTO) {
        const existingArtist = await ArtistModel.findOne({ name: artistData.name });
        if (existingArtist) {
            this.logger.error('Artist already exists:', artistData.name); // Log error if artist exists
            return { error: 'Artist already exists!' };
        }
        const artist = new ArtistModel(artistData);
        await artist.save();
        this.logger.info('Artist created:', artistData.name); // Log success message
        return artist;
    }

    // Update Artist
    async updateArtist(artistId: string, artistData: UpdateArtistDTO) {
        try {
            const artist = await ArtistModel.findByIdAndUpdate(artistId, artistData, { new: true });
            if (!artist) {
                this.logger.error('Artist not found:', artistId); // Log error if artist not found
                return null;
            }
            this.logger.info('Artist updated:', artistId); // Log success message
            return artist;
        } catch (error) {
            this.logger.error('Error updating artist:', error.message);
            return null;
        }
    }

    // Remove Artist
    async removeArtist(artistId: string) {
        const result = await ArtistModel.findByIdAndDelete(artistId);
        if (!result) {
            this.logger.error('Artist not found for removal:', artistId); // Log error if artist not found
            return { error: 'Artist not found' };
        }
        this.logger.info('Artist removed:', artistId); // Log success message
        return { message: 'Artist removed successfully' };
    }

    // Search Artists by Name or other criteria
    async searchArtist(query: SearchArtistDTO) {
        const { name, gender, about } = query;
        const artists = await ArtistModel.find({
            ...(name && { name: new RegExp(name, 'i') }),
            ...(gender && { gender }),
            ...(about && { about: new RegExp(about, 'i') }),
        });
        this.logger.info('Search for artists completed'); // Log search completion
        return artists;
    }

    // Get Latest Artists
    async getLatestArtist() {
        const latestArtists = await ArtistModel.find().sort({ createdAt: -1 }).limit(10);
        this.logger.info('Fetched latest artists'); // Log fetching latest artists
        return latestArtists;
    }

    // Get Single Artist by ID
    async getSingleArtist(artistId: string) {
        const artist = await ArtistModel.findById(artistId);
        if (!artist) {
            this.logger.error('Artist not found:', artistId); // Log error if artist not found
        }
        return artist;
    }

    // Get Actors
    async getActors() {
        const actors = await ArtistModel.find({ role: 'actor' });
        this.logger.info('Fetched actors'); // Log fetching actors
        return actors;
    }
}

