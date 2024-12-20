import { Router } from 'express';
import ArtistController from '@src/infrastructure/web/controllers/artist';
import { Logger } from 'winston';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth';
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator';

const artistRouter = (logger: Logger) => {
    const artistController = new ArtistController(logger);
    const router = Router();

    router.post('/artists', isAuth, isAdmin, artistInfoValidator, validate, async (req, res, next) => {
        try {
            await artistController.createArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.put('/artists/:id', isAuth, isAdmin, async (req, res, next) => {
        try {
            await artistController.updateArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.delete('/artists/:id', isAuth, isAdmin, async (req, res, next) => {
        try {
            await artistController.removeArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/search', isAuth, async (req, res, next) => {
        try {
            await artistController.searchArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/latest', isAuth, async (req, res, next) => {
        try {
            await artistController.getLatestArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/:id', isAuth, async (req, res, next) => {
        try {
            await artistController.getSingleArtist(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/actors', isAuth, async (req, res, next) => {
        try {
            await artistController.getActors(req, res);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default artistRouter;
