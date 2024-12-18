import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Logger } from 'winston';
import Art from '@src/infrastructure/persistence/models/artModel';
import { getAverageRatings } from '@src/utils/helper';

import { ReviewUseCase } from '@src/application/usecases/ReviewUseCase';
import { ReviewRepository } from '@src/infrastructure/persistence/repositories/review';
// import { CreateArtDTO, UpdateArtDTO, SearchArtDTO } from '@src/domain/entities/art';

export default class ReviewController {
    private reviewUseCase: ReviewUseCase;
    private logger: Logger;

    // Constructor accepting logger and initializing use case and repository
    constructor(logger: Logger) {
        const reviewRepository = new ReviewRepository(logger);
        this.reviewUseCase = new ReviewUseCase(reviewRepository, logger);
        this.logger = logger;
    }

    // Add a review
    addReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const { artId } = req.params;
            const { content, rating } = req.body;
            const userId = req.user._id;

            if (!req.user.isVerified)
                return res.status(401).json({ message: "Please verify your email!" });

            if (!isValidObjectId(artId))
                return res.status(400).json({ message: "Invalid Art ID!" });

            const art = await Art.findOne({ _id: artId, status: "public" });
            if (!art) return res.status(404).json({ message: "Art not found!" });

            const isAlreadyReviewed = await this.reviewUseCase.checkReviewExistence(userId, art._id);
            if (isAlreadyReviewed)
                return res.status(400).json({ message: "You have already reviewed!" });

            const newReview = await this.reviewUseCase.createReview(userId, art._id, content, rating);

            art.reviews.push(newReview._id);
            await art.save();

            const reviews = await getAverageRatings(art._id);

            res.json({ message: "Your review has been added.", reviews });
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

            if (!isValidObjectId(reviewId))
                return res.status(400).json({ message: "Invalid Review ID!" });

            const review = await this.reviewUseCase.getReviewByUserAndId(userId, reviewId);
            if (!review) return res.status(404).json({ message: "Review not found!" });

            await this.reviewUseCase.updateReview(reviewId, content, rating);

            res.json({ message: "Your review has been updated." });
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

            if (!isValidObjectId(reviewId))
                return res.status(400).json({ message: "Invalid Review ID!" });

            const review = await this.reviewUseCase.getReviewByUserAndId(userId, reviewId);
            if (!review) return res.status(404).json({ message: "Review not found!" });

            await this.reviewUseCase.removeReview(reviewId, review.parentArt);

            res.json({ message: "Review removed successfully." });
        } catch (error) {
            this.logger.error('Error removing review:', error instanceof Error ? error.message : 'Unknown error');
            res.status(500).json({ message: 'An unknown error occurred while removing the review.' });
        }
    };

    // Get reviews by art
    getReviewsByArt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { artId } = req.params;

            if (!isValidObjectId(artId))
                return res.status(400).json({ message: "Invalid Art ID!" });

            const art = await Art.findById(artId)
                .populate({
                    path: "reviews",
                    populate: {
                        path: "owner",
                        select: "name",
                    },
                })
                .select("reviews title");

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
            res.status(500).json({ message: 'An unknown error occurred while fetching the reviews.' });
        }
    };
}

