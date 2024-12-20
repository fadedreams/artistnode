import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioClient';
import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { ArtistUseCase } from '@src/application/usecases/ArtistUseCase';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';
import { Logger } from 'winston';

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
    createArtist = async (req: Request, res: Response): Promise<void> => {
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
                        artistData.avatar = fileName;
                    } catch (minioError) {
                        this.logger.error('Failed to upload file to MinIO', minioError);
                        return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                    }
                }

                const artist = await this.artistUseCase.createArtist(artistData);
                if (artist.error) {
                    this.logger.error('Artist creation error', artist.error);
                    return res.status(400).json({ error: artist.error });
                }

                this.logger.info('Artist created successfully', { artist });
                res.status(201).json(artist);
            });
        } catch (error: unknown) {
            this.logger.error('Error creating artist:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Update Artist
    updateArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const artistData: UpdateArtistDTO = req.body;

            const updatedArtist = await this.artistUseCase.updateArtist(artistId, artistData);
            if (updatedArtist.error) {
                this.logger.error('Error updating artist:', updatedArtist.error);
                return res.status(400).json({ error: updatedArtist.error });
            }

            this.logger.info('Artist updated successfully', { updatedArtist });
            res.status(200).json(updatedArtist);
        } catch (error) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Remove Artist
    removeArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const result = await this.artistUseCase.removeArtist(artistId);
            if (result.error) {
                this.logger.error('Error removing artist:', result.error);
                return res.status(400).json({ error: result.error });
            }

            this.logger.info('Artist removed successfully', { artistId });
            res.status(200).json({ message: 'Artist removed successfully' });
        } catch (error) {
            this.logger.error('Error removing artist:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Artists
    searchArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const query: SearchArtistDTO = req.query;
            const artists = await this.artistUseCase.searchArtist(query);
            res.status(200).json(artists);
        } catch (error) {
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Artists
    getLatestArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const latestArtists = await this.artistUseCase.getLatestArtist();
            res.status(200).json(latestArtists);
        } catch (error) {
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Artist
    getSingleArtist = async (req: Request, res: Response): Promise<void> => {
        try {
            const artistId = req.params.id;
            const artist = await this.artistUseCase.getSingleArtist(artistId);
            res.status(200).json(artist);
        } catch (error) {
            this.logger.error('Error fetching artist by ID:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Actors
    getActors = async (req: Request, res: Response): Promise<void> => {
        try {
            const actors = await this.artistUseCase.getActors();
            res.status(200).json(actors);
        } catch (error) {
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}
