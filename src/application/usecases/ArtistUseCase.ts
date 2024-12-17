import { CreateArtistDTO } from '@src/domain/entities/artist';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';

export class ArtistUseCase {
    private artistRepository: ArtistRepository;

    constructor(artistRepository: ArtistRepository) {
        this.artistRepository = artistRepository;
    }

    async createArtist(artistData: CreateArtistDTO) {
        return await this.artistRepository.createArtist(artistData);
    }

    async updateArtist(artistId: string, artistData: CreateArtistDTO) {
        return await this.artistRepository.updateArtist(artistId, artistData);
    }

    async removeArtist(artistId: string) {
        return await this.artistRepository.removeArtist(artistId);
    }

    async searchArtist(name: string) {
        return await this.artistRepository.searchArtist(name);
    }

    async getLatestArtist() {
        return await this.artistRepository.getLatestArtist();
    }

    async getSingleArtist(artistId: string) {
        return await this.artistRepository.getSingleArtist(artistId);
    }

    async getActors() {
        return await this.artistRepository.getActors();
    }
}

