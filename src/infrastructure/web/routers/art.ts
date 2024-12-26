import { Router } from 'express';
import ArtController from '@src/infrastructure/web/controllers/art';
import { Logger } from 'winston';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth'; // Adjust the path to your middlewares
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator'; // Adjust path to validator

const artRouter = (logger: Logger, redisState: any) => {
    const artController = new ArtController(logger);
    const router = Router();

    // Utility function to check cache
    const getCachedData = async (cacheKey: string) => {
        if (redisState.status.connected) {
            try {
                const cachedData = await redisState.client.get(cacheKey);
                if (cachedData) {
                    logger.info('Returning cached data from Redis.');
                    return JSON.parse(cachedData);
                }
            } catch (redisError) {
                logger.warn('Redis error occurred while checking cache.', redisError);
            }
        } else {
            logger.warn('Redis is not connected. Skipping cache lookup.');
        }
        return null;
    };

    // Utility function to set cache
    const setCache = async (cacheKey: string, data: any) => {
        if (redisState.status.connected) {
            try {
                await redisState.client.set(cacheKey, JSON.stringify(data), { EX: 3600 });
                logger.info('Cached data in Redis.');
            } catch (cacheError) {
                logger.warn('Failed to cache data in Redis.', cacheError);
            }
        }
    };

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
            const cacheKey = `art:search:${req.query.q}`; // Cache based on search query
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artController.searchArt(req, res);

            // After getting the result, cache it
            const result = res.locals.artData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    router.get('/art/latest', async (req, res, next) => {
        try {
            const cacheKey = 'art:latest';
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artController.getLatestArt(req, res);

            // After getting the result, cache it
            const result = res.locals.artData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    router.get('/art/:id', async (req, res, next) => {
        try {
            const cacheKey = `art:${req.params.id}`;
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artController.getArt(req, res);

            // After getting the result, cache it
            const result = res.locals.artData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default artRouter;
