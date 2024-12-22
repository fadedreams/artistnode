import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioConnection';
import { ArtUseCase } from '@src/application/usecases/ArtUseCase';
import { ArtRepository } from '@src/infrastructure/persistence/repositories/art';
import { Logger } from 'winston';
import { CreateArtDTO, UpdateArtDTO, SearchArtDTO, CreateArtResponse, UpdatedArtResponse, GetLatestArtResponse, GetArtResponse } from '@src/domain/entities/art';

export default class ArtController {
    private artUseCase: ArtUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        const artRepository = new ArtRepository(logger);
        this.artUseCase = new ArtUseCase(artRepository, logger);
        this.logger = logger;
    }

    private storage = multer.memoryStorage();
    private upload = multer({ storage: this.storage });

    // Create Art
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
                        newArt.poster = { url: `https://${process.env.MINIO_SERVER}/art/${fileName}`, public_id: fileName };
                    } catch (minioError) {
                        this.logger.error('Failed to upload file to MinIO', minioError);
                        return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                    }
                }

                const createdArt: CreateArtResponse = await this.artUseCase.createArt(newArt);
                if (createdArt.error) {
                    return res.status(400).json({ error: createdArt.error });
                }
                return res.status(201).json(createdArt.art);
            });
        } catch (error) {
            this.logger.error('Error creating art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Update Art
    updateArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const artData: UpdateArtDTO = req.body;

            const updatedArt: UpdatedArtResponse = await this.artUseCase.updateArt(id, artData);
            if (updatedArt.error) {
                return res.status(404).json({ error: updatedArt.error });
            }

            return res.status(200).json(updatedArt.updatedArt);
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

            if (art.error) {
                return res.status(404).json({ message: art.error });
            }

            return res.status(200).json({ message: 'Art removed successfully' });
        } catch (error) {
            this.logger.error('Error removing art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Art
    searchArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { title, artist, genre } = req.query;
            const searchParams: SearchArtDTO = { title: title?.toString(), artist: artist?.toString(), genre: genre?.toString() };

            const result = await this.artUseCase.searchArt(searchParams);
            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.arts);
        } catch (error) {
            this.logger.error('Error searching art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Art
    getLatestArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const result: GetLatestArtResponse = await this.artUseCase.getLatestArt();
            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.latestArts);
        } catch (error) {
            this.logger.error('Error fetching latest art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Art
    getSingleArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params;
            const artResponse = await this.artUseCase.getSingleArt(id);

            if (artResponse.error) {
                return res.status(404).json({ message: artResponse.error });
            }

            if (artResponse.arts && artResponse.arts.length > 0) {
                return res.status(200).json(artResponse.arts[0]); // Return the first art object from the arts array
            }

            return res.status(404).json({ message: 'Art not found' }); // Handle case if no art is found
        } catch (error) {
            this.logger.error('Error fetching art by ID:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Art with Pagination
    getArt = async (req: Request, res: Response): Promise<Response> => {
        try {
            const pageNo = Number(req.query.pageNo);
            const limit = Number(req.query.limit);

            if (isNaN(pageNo) || isNaN(limit)) {
                return res.status(400).json({ error: 'Invalid pageNo or limit value' });
            }

            const result: GetArtResponse = await this.artUseCase.getArt(pageNo, limit);
            if (result.error) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json(result.arts);
        } catch (error) {
            this.logger.error('Error fetching art:', error);
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}
