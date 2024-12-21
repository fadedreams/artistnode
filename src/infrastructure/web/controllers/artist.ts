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

    // (Additional methods will follow the same pattern for removeArtist, searchArtist, etc.)
}
