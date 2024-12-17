import { Router } from 'express';
import ArtistController from '@src/infrastructure/web/controllers/artist';
import { Logger } from 'winston';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth'; // Adjust the path to your middlewares
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator'; // Adjust path to validator

// Create a function that takes the logger and sets up the routes
const artistRouter = (logger: Logger) => {
    // Instantiate the controller with the logger
    const artistController = new ArtistController(logger);

    // Create the router instance
    const router = Router();

    // Artist Routes with Middleware
    router.post('/artists', isAuth, isAdmin, artistInfoValidator, validate, artistController.createArtist); // Create artist (requires auth, admin, and validation)
    router.put('/artists/:id', isAuth, isAdmin, artistController.updateArtist); // Update artist (requires auth & admin)
    router.delete('/artists/:id', isAuth, isAdmin, artistController.removeArtist); // Remove artist (requires auth & admin)
    router.get('/artists/search', isAuth, artistController.searchArtist); // Search artists (requires auth)
    router.get('/artists/latest', isAuth, artistController.getLatestArtist); // Get latest artists (requires auth)
    router.get('/artists/:id', isAuth, artistController.getSingleArtist); // Get a single artist by ID (requires auth)
    router.get('/artists/actors', isAuth, artistController.getActors); // Get actors (requires auth)

    return router;
};

export default artistRouter;

