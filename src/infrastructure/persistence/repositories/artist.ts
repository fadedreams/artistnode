import ArtistModel from '@src/infrastructure/persistence/models/artistModel'; // Assuming Mongoose model is imported

export class ArtistRepository {
    // Create Artist
    async createArtist(userData: any) {
        const existingArtist = await ArtistModel.findOne({ name: userData.name });
        if (existingArtist) {
            return { error: 'Artist already exists!' };
        }
        const artist = new ArtistModel(userData);
        await artist.save();
        return artist;
    }

    // Update Artist
    async updateArtist(artistId: string, artistData: any) {
        const artist = await ArtistModel.findByIdAndUpdate(artistId, artistData, { new: true });
        if (!artist) {
            return { error: 'Artist not found' };
        }
        return artist;
    }

    // Remove Artist
    async removeArtist(artistId: string) {
        const result = await ArtistModel.findByIdAndDelete(artistId);
        if (!result) {
            return { error: 'Artist not found' };
        }
        return { message: 'Artist removed successfully' };
    }

    // Search Artists by Name
    async searchArtist(name: string) {
        return await ArtistModel.find({ name: new RegExp(name, 'i') });
    }

    // Get Latest Artists (Assume latest is determined by the creation date)
    async getLatestArtist() {
        return await ArtistModel.find().sort({ createdAt: -1 }).limit(10); // Adjust limit as needed
    }

    // Get Single Artist by ID
    async getSingleArtist(artistId: string) {
        return await ArtistModel.findById(artistId);
    }

    // Get Actors (Adjust according to your logic)
    async getActors() {
        return await ArtistModel.find({ role: 'actor' }); // Adjust the query as needed
    }
}

