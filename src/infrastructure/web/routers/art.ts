import { Router } from 'express';
import ArtController from '@src/infrastructure/web/controllers/art';

import { Logger } from 'winston';

import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth'; // Adjust the path to your middlewares
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator'; // Adjust path to validator

const artRouter = (logger: Logger) => {
    const artController = new ArtController(logger);
    const router = Router();

    // Art Routes with Middleware
    router.post('/art/preview', artController.createArtPrev); // Upload art preview
    router.post('/art', isAuth, isAdmin, artController.createArt); // Create art (requires auth, admin)
    router.put('/art/:id', isAuth, isAdmin, artistInfoValidator, validate, artController.updateArt); // Update art (requires auth, admin, and validation)
    router.delete('/art/:id', isAuth, isAdmin, artController.removeArt); // Remove art (requires auth, admin)

    router.get('/art/search', artController.searchArt); // Search art
    router.get('/art/latest', artController.getLatestArt); // Get latest art
    router.get('/art/:id', artController.getArt); // Get a single art by ID

    return router;
};

export default artRouter;


