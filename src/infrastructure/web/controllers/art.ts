import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioClient'; // Import MinIO client
import { ArtUseCase } from '@src/application/usecases/ArtUseCase';
import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { Logger } from 'winston';

export default class ArtController {
    private artUseCase: ArtUseCase;
    private logger: Logger;

    // Constructor accepting logger and passing it to the use case
    constructor(logger: Logger) {
        const artRepository = new ArtRepository(logger);  // Pass logger to the repository
        this.artUseCase = new ArtUseCase(artRepository, logger);
        this.logger = logger;
    }

    // Set up multer for file upload handling
    private storage = multer.memoryStorage();
    private upload = multer({ storage: this.storage });

    // Create Art
    createArt = async (req: Request, res: Response): Promise<void> => {
        try {
            this.upload.single('file')(req, res, async (err: any) => {
                if (err) {
                    this.logger.error('Error during file upload', err);
                    return res.status(400).json({ error: 'Error during file upload' });
                }

                const { file, body } = req;
                const {
                    title,
                    director,
                    releaseDate,
                    status,
                    type,
                    artcats,
                    tags,
                    artists,
                    writers,
                    poster,
                } = body;

                const newArt = {
                    title,
                    director,
                    releaseDate,
                    status,
                    type,
                    artcats,
                    tags,
                    artists,
                    writers,
                    poster,
                };

                if (file) {
                    const fileName = Date.now() + '-' + file.originalname;
                    const fileBuffer = file.buffer;

                    try {
                        // Upload file to MinIO
                        await minioClient.putObject('art', fileName, fileBuffer);
                        // Set the poster with the MinIO file details
                        newArt.poster = { url: `https://<minio-server-url>/art/${fileName}`, fileName };
                    } catch (minioError) {
                        this.logger.error('Failed to upload file to MinIO', minioError);
                        return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                    }
                }

                await this.artUseCase.createArt(newArt);

                this.logger.info('Art created successfully', { newArt });
                res.status(201).json({
                    id: newArt._id,
                    title: newArt.title,
                    // Include other fields as needed in the response
                });
            });
        } catch (error) {
            this.logger.error('Error creating art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Update Art
    updateArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { name, about, gender, file } = req.body;

            const art = await this.artUseCase.updateArt(id, { name, about, gender });

            if (!art) {
                this.logger.error('Error updating art: No art found', { id });
                return res.status(404).json({ message: `No art with id: ${id}` });
            }

            if (file) {
                const fileName = Date.now() + '-' + file.originalname;
                const fileBuffer = file.buffer;

                try {
                    // Upload file to MinIO
                    await minioClient.putObject('art', fileName, fileBuffer);
                    // Update the avatar with the MinIO file details
                    art.avatar = { url: `https://<minio-server-url>/art/${fileName}`, fileName };
                } catch (minioError) {
                    this.logger.error('Failed to upload file to MinIO', minioError);
                    return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                }
            }

            await art.save();

            this.logger.info('Art updated successfully', { art });
            res.status(200).json(art);
        } catch (error) {
            this.logger.error('Error updating art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Remove Art
    removeArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const art = await this.artUseCase.removeArt(id);

            if (!art) {
                this.logger.error('Error removing art: No art found', { id });
                return res.status(404).json({ message: 'Art not found' });
            }

            this.logger.info('Art removed successfully', { id });
            res.status(200).json({ message: 'Art removed successfully' });
        } catch (error) {
            this.logger.error('Error removing art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Art
    searchArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name } = req.query;
            if (!name.trim()) return res.json({ results: [] });

            const result = await this.artUseCase.searchArt(name);
            this.logger.info('Art search performed', { name });
            res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error searching art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Art
    getLatestArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.artUseCase.getLatestArt();
            this.logger.info('Latest art fetched');
            res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error fetching latest art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Art
    getSingleArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const art = await this.artUseCase.getSingleArt(id);

            if (!art) {
                this.logger.error('Art not found', { id });
                return res.status(404).json({ message: 'Art not found' });
            }

            this.logger.info('Art details fetched', { id });
            res.status(200).json({ art });
        } catch (error) {
            this.logger.error('Error fetching art by ID:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Art
    getArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { pageNo, limit } = req.query;
            const result = await this.artUseCase.getArt(pageNo, limit);

            this.logger.info('Fetched paginated art');
            res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error fetching art:', error instanceof Error ? error.message : 'Unknown error');
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}

