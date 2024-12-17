import express from 'express';
import { create, signIn } from '@src/infrastructure/web/controllers/user';
import { createArtist, updateArtist, removeArtist, searchArtist, getLatestArtist, getSingleArtist, getActors } from '@src/infrastructure/web/controllers/artist';
import { userValidator, validate, artistInfoValidator } from '@src/infrastructure/web/middlewares/validator';
import { isAuth, isAdmin } from '@src/infrastructure/web/middlewares/auth';

const router = express.Router();

// Create Artist
router.post('/create', isAuth, isAdmin, artistInfoValidator, validate, createArtist);

// Update Artist
router.put('/update/:id', isAuth, isAdmin, validate, updateArtist);

// Remove Artist
router.delete('/remove/:id', isAuth, isAdmin, removeArtist);

// Search Artists
router.get('/search', isAuth, isAdmin, validate, searchArtist);

// Get Latest Artists
router.get('/latest', isAuth, isAdmin, getLatestArtist);

// Get Single Artist
router.get('/:id', isAuth, isAdmin, getSingleArtist);

// Get Actors (specific role filter)
router.get('/actors', isAuth, isAdmin, getActors);

export default router;

