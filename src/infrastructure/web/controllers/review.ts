import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Logger } from 'winston';
import Art from '@src/infrastructure/persistence/models/artModel';
import { getAverageRatings } from '@src/utils/helper';
import { ReviewUseCase } from '@src/application/usecases/ReviewUseCase';
import { ReviewRepository } from '@src/infrastructure/persistence/repositories/review';

export default class ReviewController {
    private reviewUseCase: ReviewUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        const reviewRepository = new ReviewRepository(logger);
        this.reviewUseCase = new ReviewUseCase(reviewRepository, logger);
        this.logger = logger;
    }

    // Add a review
    addReview = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { artId } = req.params;
            const { content, rating } = req.body;
            const userId = req.user._id;

            if (!req.user.isVerified) {
                this.logger.error('User is not verified!');
                return res.status(401).json({ message: 'Please verify your email!' });
            }

            if (!isValidObjectId(artId)) {
                this.logger.error('Invalid Art ID!');
                return res.status(400).json({ message: 'Invalid Art ID!' });
            }

            const art = await Art.findOne({ _id: artId, status: "public" });
            if (!art) {
                this.logger.error('Art not found!');
                return res.status(404).json({ message: 'Art not found!' });
            }

            const isAlreadyReviewed = await this.reviewUseCase.checkReviewExistence(userId, art._id.toString());
            if (isAlreadyReviewed) {
                this.logger.error('You have already reviewed!');
                return res.status(400).json({ message: 'You have already reviewed!' });
            }

            const newReview = await this.reviewUseCase.createReview({ userId, artId: art._id.toString(), content, rating });

            art.reviews.push(newReview.review._id);
            await art.save();

            const reviews = await getAverageRatings(art._id.toString());

            res.json({ message: 'Your review has been added.', reviews });
        } catch (error) {
            this.logger.error('Error adding review:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ message: 'An unknown error occurred while adding the review.' });
        }
    };

    // Update a review
    updateReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const { reviewId } = req.params;
            const { content, rating } = req.body;
            const userId = req.user._id;

            if (!isValidObjectId(reviewId)) {
                return res.status(400).json({ message: 'Invalid Review ID!' });
            }

            const review = await this.reviewUseCase.getSingleReview(reviewId);
            if (!review.success) {
                return res.status(404).json({ message: 'Review not found!' });
            }

            const updatedReview = await this.reviewUseCase.updateReview(reviewId, { content, rating });
            if (updatedReview.success) {
                res.json({ message: 'Your review has been updated.' });
            } else {
                res.status(400).json({ message: 'Review update failed.' });
            }
        } catch (error) {
            this.logger.error('Error updating review:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ message: 'An unknown error occurred while updating the review.' });
        }
    };

    // Remove a review
    removeReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const { reviewId } = req.params;
            const userId = req.user._id;

            if (!isValidObjectId(reviewId)) {
                return res.status(400).json({ message: 'Invalid Review ID!' });
            }

            const review = await this.reviewUseCase.getSingleReview(reviewId);
            if (!review.success) {
                return res.status(404).json({ message: 'Review not found!' });
            }

            const result = await this.reviewUseCase.removeReview(reviewId);
            if (result.success) {
                res.json({ message: 'Review removed successfully.' });
            } else {
                res.status(400).json({ message: 'Error removing review.' });
            }
        } catch (error) {
            this.logger.error('Error removing review:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ message: 'An unknown error occurred while removing the review.' });
        }
    };

    // Get reviews by art
    getReviewsByArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { artId } = req.params;

            if (!isValidObjectId(artId)) {
                return res.status(400).json({ message: 'Invalid Art ID!' });
            }

            const art = await Art.findById(artId)
                .populate({
                    path: 'reviews',
                    populate: {
                        path: 'owner',
                        select: 'name',
                    },
                })
                .select('reviews title');

            if (!art) {
                this.logger.error('Art not found!');
                return res.status(404).json({ message: 'Art not found!' });
            }

            const reviews = art.reviews.map((r) => {
                const { owner, content, rating, _id: reviewID } = r;
                const { name, _id: ownerId } = owner;

                return {
                    id: reviewID,
                    owner: {
                        id: ownerId,
                        name,
                    },
                    content,
                    rating,
                };
            });

            res.json({ art: { reviews, title: art.title } });
        } catch (error) {
            this.logger.error('Error fetching reviews:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ message: 'An unknown error occurred while fetching reviews.' });
        }
    };
}

