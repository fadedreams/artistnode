import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioClient';
import { ArtistUseCase } from '@src/application/usecases/ArtistUseCase';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';
import { Logger } from 'winston';
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
    GetArtistsResponse
} from '@src/domain/entities/artist';

export default class ArtistController {
    private artistUseCase: ArtistUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        const artistRepository = new ArtistRepository(logger);  // Pass logger to the repository
        this.artistUseCase = new ArtistUseCase(artistRepository, logger);
        this.logger = logger;
    }

    // Set up multer for file upload handling
    private storage = multer.memoryStorage();
    private upload = multer({ storage: this.storage });

    // Create Artist
    createArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            this.upload.single('file')(req, res, async (err: any) => {
                if (err) {
                    this.logger.error('Error during file upload', err);
                    return res.status(400).json({ error: 'Error during file upload' });
                }

                const artistData: CreateArtistDTO = req.body;
                const file = req.file;

                if (file) {
                    const fileName = Date.now() + '-' + file.originalname;
                    const fileBuffer = file.buffer;

                    try {
                        await minioClient.putObject('artists', fileName, fileBuffer);
                        artistData.avatar = { url: fileName };  // Assuming avatar has a URL property
                    } catch (minioError) {
                        this.logger.error('Failed to upload file to MinIO', minioError);
                        return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                    }
                }

                const artistResponse = await this.artistUseCase.createArtist(artistData);

                // Check if the response is success or failure
                if (artistResponse.success === false) {
                    // If it's a failure or error response, we handle it here
                    this.logger.error('Artist creation error', artistResponse.error);
                    return res.status(400).json({ error: artistResponse.error || 'An unknown error occurred' });
                }

                // If it's a success response
                this.logger.info('Artist created successfully', { artist: artistResponse.artist });
                return res.status(201).json(artistResponse.artist);  // Return the artist object
            });
        } catch (error: unknown) {
            this.logger.error('Error creating artist:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Update Artist
    updateArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const artistData: UpdateArtistDTO = req.body;

            const updatedArtist = await this.artistUseCase.updateArtist(artistId, artistData);
            if (!updatedArtist.success) {
                this.logger.error('Error updating artist:', updatedArtist.error);
                return res.status(400).json({ error: updatedArtist.error });
            }

            this.logger.info('Artist updated successfully', { updatedArtist });
            return res.status(200).json(updatedArtist);  // Return the updated artist
        } catch (error) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Remove Artist
    removeArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const result = await this.artistUseCase.removeArtist(artistId);
            if (!result.success) {
                this.logger.error('Error removing artist:', result.error);
                return res.status(400).json({ error: result.error });
            }

            this.logger.info('Artist removed successfully', { artistId });
            return res.status(200).json({ message: 'Artist removed successfully' });
        } catch (error) {
            this.logger.error('Error removing artist:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Artist
    searchArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const query: SearchArtistDTO = req.body;  // Adjust as needed
            const artists = await this.artistUseCase.searchArtist(query);
            if (!artists.success) {
                this.logger.error('Error searching artists:', artists.error);
                return res.status(400).json({ error: artists.error });
            }

            this.logger.info('Artists found successfully', { artists });
            return res.status(200).json(artists);
        } catch (error) {
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Artists
    getLatestArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const latestArtists = await this.artistUseCase.getLatestArtist();
            if (!latestArtists.success) {
                this.logger.error('Error fetching latest artists:', latestArtists.error);
                return res.status(400).json({ error: latestArtists.error });
            }

            this.logger.info('Latest artists fetched successfully', { latestArtists });
            return res.status(200).json(latestArtists);
        } catch (error) {
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Artist
    getSingleArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const artist = await this.artistUseCase.getSingleArtist(artistId);
            if (!artist.success) {
                this.logger.error('Artist not found:', artist.error);
                return res.status(404).json({ error: artist.error });
            }

            this.logger.info('Artist found successfully', { artist });
            return res.status(200).json(artist);
        } catch (error) {
            this.logger.error('Error fetching artist by ID:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Actors
    getActors = async (req: Request, res: Response): Promise<void> => {
        try {
            const actors = await this.artistUseCase.getActors();
            if (!actors.success) {
                this.logger.error('Error fetching actors:', actors.error);
                return res.status(400).json({ error: actors.error });
            }

            this.logger.info('Actors fetched successfully', { actors });
            return res.status(200).json(actors);
        } catch (error) {
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}
