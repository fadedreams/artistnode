import ArtistModel from '@src/infrastructure/persistence/models/artistModel';

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
    GetArtistsResponse,
    GetActorsResponse
} from '@src/domain/entities/artist';
import { Logger } from 'winston';

import IArtistRepository from '@src/domain/interfaces/IArtistRepository';

export class ArtistRepository implements IArtistRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    // Create Artist
    async createArtist(artistData: CreateArtistDTO): Promise<CreateArtistResponse> {
        const existingArtist = await ArtistModel.findOne({ name: artistData.name });
        if (existingArtist) {
            this.logger.error('Artist already exists:', artistData.name); // Log error if artist exists
            return { error: 'Artist already exists!' };
        }

        const artistDoc = new ArtistModel(artistData);
        await artistDoc.save();
        this.logger.info('Artist created:', artistData.name); // Log success message

        // Convert the ObjectId to a string before returning
        const artist: IArtist = {
            _id: artistDoc._id.toString(),  // Convert ObjectId to string
            name: artistDoc.name,
            about: artistDoc.about,
            gender: artistDoc.gender,
            avatar: artistDoc.avatar,
            createdAt: artistDoc.createdAt,
            updatedAt: artistDoc.updatedAt,
        };

        return { success: true, artist }; // Return the artist object
    }

    // Update Artist

    async updateArtist(
        artistId: string,  // Assuming the artistId passed as string
        artistData: UpdateArtistDTO
    ): Promise<CreateArtistResponse> {
        const artistDoc = await ArtistModel.findById(artistId);
        if (!artistDoc) {
            this.logger.error('Artist not found:', artistId);
            return { error: 'Artist not found!' };
        }

        // Update the artist document with new data
        artistDoc.set(artistData);
        await artistDoc.save();
        this.logger.info('Artist updated:', artistId);

        // Convert _id to string before returning
        const artist: IArtist = {
            _id: artistDoc._id.toString(),
            name: artistDoc.name,
            about: artistDoc.about,
            gender: artistDoc.gender,
            avatar: artistDoc.avatar,
            createdAt: artistDoc.createdAt,
            updatedAt: artistDoc.updatedAt,
        };

        return { success: true, artist };
    }


    // Remove Artist
    async removeArtist(artistId: string): Promise<{ message?: string; error?: string }> {
        const result = await ArtistModel.findByIdAndDelete(artistId);
        if (!result) {
            this.logger.error('Artist not found for removal:', artistId); // Log error if artist not found
            return { error: 'Artist not found' };
        }
        this.logger.info('Artist removed:', artistId); // Log success message
        return { message: 'Artist removed successfully' };
    }

    // Search Artists by Name or other criteria
    async searchArtist(
        searchCriteria: SearchArtistDTO
    ): Promise<SearchArtistResponse> {
        const artistsDoc = await ArtistModel.find(searchCriteria);
        if (!artistsDoc.length) {
            this.logger.error('No artists found with criteria:', searchCriteria);
            return { error: 'No artists found' };
        }

        // Convert _id to string for all artists
        const artists: IArtist[] = artistsDoc.map((artistDoc) => ({
            _id: artistDoc._id.toString(),
            name: artistDoc.name,
            about: artistDoc.about,
            gender: artistDoc.gender,
            avatar: artistDoc.avatar,
            createdAt: artistDoc.createdAt,
            updatedAt: artistDoc.updatedAt,
        }));

        return { success: true, artists };
    }

    // Get Latest Artists
    async getLatestArtist(): Promise<GetSingleArtistResponse> {
        const artistDoc = await ArtistModel.findOne().sort({ createdAt: -1 }).exec();
        if (!artistDoc) {
            this.logger.error('No artist found');
            return { error: 'No artist found' };
        }

        const artist: IArtist = {
            _id: artistDoc._id.toString(),
            name: artistDoc.name,
            about: artistDoc.about,
            gender: artistDoc.gender,
            avatar: artistDoc.avatar,
            createdAt: artistDoc.createdAt,
            updatedAt: artistDoc.updatedAt,
        };

        return { success: true, artist };
    }

    // Get Single Artist by ID
    async getSingleArtist(artistId: string): Promise<IArtist | null> {
        const artistDoc = await ArtistModel.findById(artistId);
        if (!artistDoc) {
            this.logger.error('Artist not found:', artistId); // Log error if artist not found
            return null; // Return null if no artist is found
        }

        // Convert the artist document to the IArtist interface
        const artist: IArtist = {
            _id: artistDoc._id.toString(), // Convert ObjectId to string
            name: artistDoc.name,
            about: artistDoc.about,
            gender: artistDoc.gender,
            avatar: artistDoc.avatar,
            createdAt: artistDoc.createdAt,
            updatedAt: artistDoc.updatedAt,
        };

        return artist; // Return the artist object
    }

    // Get Actors
    async getActors(): Promise<GetActorsResponse> {
        const actorsDoc = await ArtistModel.find({ gender: 'actor' });
        if (!actorsDoc.length) {
            this.logger.error('No actors found');
            return { error: 'No actors found' };
        }

        // Convert _id to string for all actors
        const actors: IArtist[] = actorsDoc.map((actorDoc) => ({
            _id: actorDoc._id.toString(),
            name: actorDoc.name,
            about: actorDoc.about,
            gender: actorDoc.gender,
            avatar: actorDoc.avatar,
            createdAt: actorDoc.createdAt,
            updatedAt: actorDoc.updatedAt,
        }));

        return { success: true, actors: actors };  // Assuming you want to return "artists" here
    }
}
