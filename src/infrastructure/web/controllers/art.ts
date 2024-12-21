import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioClient';
import { ArtUseCase } from '@src/application/usecases/ArtUseCase';
import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { Logger } from 'winston';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO } from '@src/domain/entities/art';

export default class ArtController {
    private artUseCase: ArtUseCase;
    private logger: Logger;

    // Constructor accepting logger and passing it to the use case
    constructor(logger: Logger) {
        const artRepository = new ArtRepository(logger);
        this.artUseCase = new ArtUseCase(artRepository, logger);
        this.logger = logger;
    }

    // Set up multer for file upload handling
    private storage = multer.memoryStorage();
    private upload = multer({ storage: this.storage });

    createArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            this.upload.single('file')(req, res, async (err: any) => {
                if (err) {
                    this.logger.error('Error during file upload', err);
                    return res.status(400).json({ error: 'Error during file upload' });
                }

                const { file, body } = req;
                const newArt: CreateArtDTO = { ...body };

                if (file) {
                    const fileName = Date.now() + '-' + file.originalname;
                    try {
                        await minioClient.putObject('art', fileName, file.buffer);
                        newArt.poster = { url: `https://${process.env.MINIO_SERVER}/art/${fileName}`, fileName };
                    } catch (minioError) {
                        this.logger.error('Failed to upload file to MinIO', minioError);
                        return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                    }
                }

                const createdArt = await this.artUseCase.createArt(newArt);
                return res.status(201).json(createdArt);
            });
        } catch (error) {
            this.logger.error('Error creating art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    updateArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const artData: UpdateArtDTO = req.body;

            const updatedArt = await this.artUseCase.updateArt(id, artData);
            if (!updatedArt) {
                return res.status(404).json({ error: 'Art not found' });
            }

            return res.status(200).json(updatedArt);
        } catch (error) {
            this.logger.error('Error updating art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Remove Art
    removeArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const art = await this.artUseCase.removeArt(id);

            if (!art) {
                this.logger.error('Error removing art: No art found', { id });
                return res.status(404).json({ message: 'Art not found' });
            }

            this.logger.info('Art removed successfully', { id });
            return res.status(200).json({ message: 'Art removed successfully' });
        } catch (error) {
            this.logger.error('Error removing art:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Art
    searchArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { name } = req.query;
            if (name && name.toString().trim()) {
                return res.status(400).json({ error: 'Invalid search query' });
            }
            const result = await this.artUseCase.searchArt(name);
            this.logger.info('Art search performed', { name });
            return res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error searching art:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Art
    getLatestArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const result = await this.artUseCase.getLatestArt();
            this.logger.info('Latest art fetched');
            return res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error fetching latest art:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Art
    getSingleArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const art = await this.artUseCase.getSingleArt(id);

            if (!art) {
                this.logger.error('Art not found', { id });
                return res.status(404).json({ message: 'Art not found' });
            }

            this.logger.info('Art details fetched', { id });
            return res.status(200).json({ art });
        } catch (error) {
            this.logger.error('Error fetching art by ID:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Art
    getArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const pageNo = Number(req.query.pageNo);
            const limit = Number(req.query.limit);

            if (isNaN(pageNo) || isNaN(limit)) {
                return res.status(400).json({ error: 'Invalid pageNo or limit value' });
            }

            const result = await this.artUseCase.getArt(pageNo, limit);

            this.logger.info('Fetched paginated art');
            return res.status(200).json({ art: result });
        } catch (error) {
            this.logger.error('Error fetching art:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}
