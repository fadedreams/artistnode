import ArtistModel from '@src/infrastructure/persistence/models/artistModel';
import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';

export class ArtistRepository {
    // Create Artist
    async createArtist(artistData: CreateArtistDTO) {
        const existingArtist = await ArtistModel.findOne({ name: artistData.name });
        if (existingArtist) {
            return { error: 'Artist already exists!' };
        }
        const artist = new ArtistModel(artistData);
        await artist.save();
        return artist;
    }

    // Update Artist
    async updateArtist(artistId: string, artistData: UpdateArtistDTO) {
        try {
            const artist = await ArtistModel.findByIdAndUpdate(artistId, artistData, { new: true });
            if (!artist) {
                return null;  // Return null if artist is not found
            }
            return artist;
        } catch (error) {
            console.error("Error updating artist:", error);
            return null;  // Return null in case of error
        }
    }

    // Remove Artist
    async removeArtist(artistId: string) {
        const result = await ArtistModel.findByIdAndDelete(artistId);
        if (!result) {
            return { error: 'Artist not found' };
        }
        return { message: 'Artist removed successfully' };
    }

    // Search Artists by Name or other criteria
    async searchArtist(query: SearchArtistDTO) {
        const { name, gender, about } = query;
        return await ArtistModel.find({
            ...(name && { name: new RegExp(name, 'i') }),
            ...(gender && { gender }),
            ...(about && { about: new RegExp(about, 'i') }),
        });
    }

    // Get Latest Artists
    async getLatestArtist() {
        return await ArtistModel.find().sort({ createdAt: -1 }).limit(10); // Adjust limit as needed
    }

    // Get Single Artist by ID
    async getSingleArtist(artistId: string) {
        return await ArtistModel.findById(artistId);
    }

    // Get Actors
    async getActors() {
        return await ArtistModel.find({ role: 'actor' }); // Assuming 'role' is a field in the Artist model
    }
}

