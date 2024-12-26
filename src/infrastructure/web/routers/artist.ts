import { Router } from 'express';
import ArtistController from '@src/infrastructure/web/controllers/artist';
import { Logger } from 'winston';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth';
import { artistInfoValidator, validate } from '@src/infrastructure/web/middlewares/validator';

const artistRouter = (logger: Logger, redisState: any) => {
    const artistController = new ArtistController(logger);
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
            const cacheKey = `artists:search:${req.query.q}`; // Cache based on search query
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artistController.searchArtist(req, res);

            // After getting the result, cache it
            const result = res.locals.artistData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/latest', isAuth, async (req, res, next) => {
        try {
            const cacheKey = 'artists:latest';
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artistController.getLatestArtist(req, res);

            // After getting the result, cache it
            const result = res.locals.artistData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/:id', isAuth, async (req, res, next) => {
        try {
            const cacheKey = `artists:${req.params.id}`;
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artistController.getSingleArtist(req, res);

            // After getting the result, cache it
            const result = res.locals.artistData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    router.get('/artists/actors', isAuth, async (req, res, next) => {
        try {
            const cacheKey = 'artists:actors';
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                return;
            }

            await artistController.getActors(req, res);

            // After getting the result, cache it
            const result = res.locals.artistData; // Assuming the result is set in res.locals
            await setCache(cacheKey, result);

            // Send the response
            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default artistRouter;
