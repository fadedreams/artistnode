import { Request, Response } from 'express';
import multer from 'multer';
import minioClient from '@src/infrastructure/persistence/minioClient';
import { CreateArtistDTO, UpdateArtistDTO, SearchArtistDTO } from '@src/domain/entities/artist';
import { ArtistUseCase } from '@src/application/usecases/ArtistUseCase';
import { ArtistRepository } from '@src/infrastructure/persistence/repositories/artist';

const artistRepository = new ArtistRepository();
const artistUseCase = new ArtistUseCase(artistRepository);

// Set up multer for file upload handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create Artist
export const createArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        upload.single('file')(req, res, async (err: any) => {
            if (err) {
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
                    return res.status(500).json({ error: 'Failed to upload file to MinIO' });
                }
            }

            const artist = await artistUseCase.createArtist(artistData);
            if (artist.error) {
                return res.status(400).json({ error: artist.error });
            }
            res.status(201).json(artist);
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: 'An unknown error occurred' });
        }
    }
};

// Update Artist
export const updateArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistId = req.params.id;
        const artistData: UpdateArtistDTO = req.body;

        const updatedArtist = await artistUseCase.updateArtist(artistId, artistData);
        if (updatedArtist.error) {
            return res.status(400).json({ error: updatedArtist.error });
        }
        res.status(200).json(updatedArtist);
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

// Remove Artist
export const removeArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistId = req.params.id;
        const result = await artistUseCase.removeArtist(artistId);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.status(200).json({ message: 'Artist removed successfully' });
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

// Search Artists
export const searchArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const query: SearchArtistDTO = req.query;
        const artists = await artistUseCase.searchArtist(query);
        res.status(200).json(artists);
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

// Get Latest Artists
export const getLatestArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const latestArtists = await artistUseCase.getLatestArtist();
        res.status(200).json(latestArtists);
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

// Get Single Artist
export const getSingleArtist = async (req: Request, res: Response): Promise<void> => {
    try {
        const artistId = req.params.id;
        const artist = await artistUseCase.getSingleArtist(artistId);
        res.status(200).json(artist);
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

// Get Actors
export const getActors = async (req: Request, res: Response): Promise<void> => {
    try {
        const actors = await artistUseCase.getActors();
        res.status(200).json(actors);
    } catch (error) {
        res.status(400).json({ error: 'An unknown error occurred' });
    }
};

