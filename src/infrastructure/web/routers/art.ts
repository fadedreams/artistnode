import { Router } from 'express';
import ArtController from '@src/infrastructure/web/controllers/art';
import { Logger } from 'winston';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth'; // Adjust the path to your middlewares
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator'; // Adjust path to validator

const artRouter = (logger: Logger) => {
    const artController = new ArtController(logger);
    const router = Router();

    router.post('/art', isAuth, isAdmin, async (req, res, next) => {
        try {
            await artController.createArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.put('/art/:id', isAuth, isAdmin, artistInfoValidator, validate, async (req, res, next) => {
        try {
            await artController.updateArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.delete('/art/:id', isAuth, isAdmin, async (req, res, next) => {
        try {
            await artController.removeArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/art/search', async (req, res, next) => {
        try {
            await artController.searchArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/art/latest', async (req, res, next) => {
        try {
            await artController.getLatestArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    router.get('/art/:id', async (req, res, next) => {
        try {
            await artController.getArt(req, res);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default artRouter;
