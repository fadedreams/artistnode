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
    GetArtistsResponse,
    GetActorsResponse
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
    updateArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const artistId = req.params.id;
            const artistData: UpdateArtistDTO = req.body;

            const updatedArtistResponse = await this.artistUseCase.updateArtist(artistId, artistData);

            // Check the success flag of the response
            if (updatedArtistResponse.success === false) {
                // If the update failed or there was an error, handle the failure
                this.logger.error('Error updating artist:', updatedArtistResponse.error);
                return res.status(400).json({ error: updatedArtistResponse.error || 'An unknown error occurred' });
            }

            // If update was successful
            this.logger.info('Artist updated successfully', { updatedArtist: updatedArtistResponse.updatedArtist });
            return res.status(200).json(updatedArtistResponse.updatedArtist);  // Return the updated artist
        } catch (error: unknown) {
            this.logger.error('Error updating artist:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Remove Artist
    removeArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const artistId = req.params.id;

            // Attempt to remove the artist using the use case
            const removeArtistResponse = await this.artistUseCase.removeArtist(artistId);

            // Check if the remove operation was successful
            if (removeArtistResponse.success === false) {
                // If the removal failed, return an error message
                this.logger.error('Error removing artist:', removeArtistResponse.error);
                return res.status(400).json({ error: removeArtistResponse.error || 'An unknown error occurred' });
            }

            // If removal was successful
            this.logger.info('Artist removed successfully', { artistId });
            return res.status(200).json({ message: 'Artist removed successfully' });
        } catch (error: unknown) {
            // Handle any errors that occur during the try block
            this.logger.error('Error removing artist:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Search Artist
    searchArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const query: SearchArtistDTO = req.body;  // Get the search query from the request body

            // Attempt to search for artists using the use case
            const searchArtistsResponse = await this.artistUseCase.searchArtist(query);

            // Check if the search was successful
            if (searchArtistsResponse.success === false) {
                // If the search failed, return the error message
                this.logger.error('Error searching artists:', searchArtistsResponse.error);
                return res.status(400).json({ error: searchArtistsResponse.error || 'An unknown error occurred' });
            }

            // If artists are found successfully
            this.logger.info('Artists found successfully', { artists: searchArtistsResponse.artists });
            return res.status(200).json(searchArtistsResponse);  // Return the found artists
        } catch (error: unknown) {
            // Handle any errors that occur during the try block
            this.logger.error('Error searching artists:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Latest Artists
    getLatestArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            // Fetch the latest artists using the use case
            const latestArtistsResponse = await this.artistUseCase.getLatestArtist();

            // Check if the fetch was successful
            if (latestArtistsResponse.success === false) {
                // If there was an error, log it and return an error message
                this.logger.error('Error fetching latest artists:', latestArtistsResponse.error);
                return res.status(400).json({ error: latestArtistsResponse.error || 'An unknown error occurred' });
            }

            // If the artists are fetched successfully
            this.logger.info('Latest artists fetched successfully', { latestArtists: latestArtistsResponse.artists });
            return res.status(200).json(latestArtistsResponse);  // Return the latest artists
        } catch (error: unknown) {
            // Handle any unexpected errors
            this.logger.error('Error fetching latest artists:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Single Artist
    getSingleArtist = async (req: Request, res: Response): Promise<Response> => {
        try {
            const artistId = req.params.id;  // Get the artist ID from the request parameters
            const artistResponse = await this.artistUseCase.getSingleArtist(artistId);

            // Check if the fetch was successful
            if (!artistResponse.success) {
                // If there was an error or the artist was not found
                this.logger.error('Artist not found:', artistResponse.error);
                return res.status(404).json({ error: artistResponse.error || 'Artist not found' });
            }

            // If the artist is found successfully
            this.logger.info('Artist found successfully', { artist: artistResponse.artist });
            return res.status(200).json(artistResponse);  // Return the found artist
        } catch (error: unknown) {
            // Handle any unexpected errors
            this.logger.error('Error fetching artist by ID:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };

    // Get Actors
    getActors = async (req: Request, res: Response): Promise<Response> => {
        try {
            const actorsResponse: GetActorsResponse = await this.artistUseCase.getActors();

            // Check if the fetch was successful
            if (!actorsResponse.success) {
                // If there was an error or no actors found
                this.logger.error('Error fetching actors:', actorsResponse.error);
                return res.status(400).json({ error: actorsResponse.error || 'Actors not found' });
            }

            // If actors are fetched successfully
            this.logger.info('Actors fetched successfully', { actors: actorsResponse.actors });
            return res.status(200).json(actorsResponse);  // Return the fetched actors
        } catch (error: unknown) {
            // Handle any unexpected errors
            this.logger.error('Error fetching actors:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(400).json({ error: 'An unknown error occurred' });
        }
    };
}
