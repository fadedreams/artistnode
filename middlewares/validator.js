import { check, validationResult } from 'express-validator';
//import { isValidObjectId } from 'mongoose';
//import genres from '../utils/genres';

export const userValidator = [
  check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Email is invalid!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is missing!')
    .isLength({ min: 1, max: 20 })
    .withMessage('Password must be 1 to 20 characters long!'),
];

export const validatePassword = [
  check('newPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is missing!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be 8 to 20 characters long!'),
];

export const signInValidator = [
  check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Email is invalid!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is missing!'),
];

export const artistInfoValidator = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Artist name is missing!'),
];

export const validateArt = [
  check('title')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Art title is missing!'),
  check('storyLine')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Storyline is important!'),
  check('language')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Language is missing!'),
  check('releseDate')
    .isDate()
    .withMessage('Release date is missing!'),
  // Add the rest of the art validation here
];

export const validateTrailer = check('trailer')
  .isObject()
  .withMessage('Trailer must be an object with url and public_id')
  .custom(({ url, public_id }) => {
    // Add the custom validation for the trailer here
  });

export const validateRatings = check(
  'rating',
  'Rating must be a number between 0 and 5.'
).isFloat({ min: 0, max: 5 });

export const validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (error.length) {
    return res.json({ error: error[0].msg });
  }
  next();
};


export const validateArt = [
  check("title").trim().not().isEmpty().withMessage("Art title is missing!"),
  check("releaseDate").isDate().withMessage("Release date is missing!"),
];


