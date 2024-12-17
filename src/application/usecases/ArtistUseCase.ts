import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';

export class ArtistUseCase {
    private artistRepository: ArtistRepository;

    constructor(artistRepository: ArtistRepository) {
        this.artistRepository = artistRepository;
    }

    async createArtist(artistData: CreateArtistDTO) {
        try {
            const artist = await this.artistRepository.createArtist(artistData);
            return { success: true, artist }; // Wrap the response in a success object
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async updateArtist(artistId: string, artistData: UpdateArtistDTO) {
        try {
            const updatedArtist = await this.artistRepository.updateArtist(artistId, artistData);
            return { success: true, updatedArtist }; // Return success object with updated artist
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async removeArtist(artistId: string) {
        try {
            const result = await this.artistRepository.removeArtist(artistId);
            return { success: true, message: 'Artist removed successfully', result }; // Return success message
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async searchArtist(query: SearchArtistDTO) {
        try {
            const artists = await this.artistRepository.searchArtist(query);
            return { success: true, artists }; // Return success with search results
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async getLatestArtist() {
        try {
            const latestArtists = await this.artistRepository.getLatestArtist();
            return { success: true, latestArtists }; // Return success with latest artists
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async getSingleArtist(artistId: string) {
        try {
            const artist = await this.artistRepository.getSingleArtist(artistId);
            return { success: true, artist }; // Return success with the single artist
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }

    async getActors() {
        try {
            const actors = await this.artistRepository.getActors();
            return { success: true, actors }; // Return success with list of actors
        } catch (error: unknown) {
            // Narrowing the type of error to handle it safely
            if (error instanceof Error) {
                return { error: error.message }; // Return error message if it's an instance of Error
            } else {
                // If it's not an instance of Error, handle it safely
                return { error: 'An unknown error occurred' };
            }
        }
    }
}

