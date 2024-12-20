import { isValidObjectId } from 'mongoose';
import { Logger } from 'winston';
import Art from '@src/infrastructure/persistence/models/artModel';
import { getAverageRatings } from '@src/utils/helper';

import { ReviewUseCase } from '@src/application/usecases/ReviewUseCase';
import { ReviewRepository } from '@src/infrastructure/persistence/repositories/review';

import { Router, Request, Response, NextFunction } from 'express';
import { CreateReviewDTO, UpdateReviewDTO, IReview, UpdatedReviewResponse, ReviewUpdateResult } from '@src/domain/entities/review';

export default class ReviewController {
    private reviewUseCase: ReviewUseCase;
    private logger: Logger;

    constructor(logger: Logger) {
        const reviewRepository = new ReviewRepository(logger);
        this.reviewUseCase = new ReviewUseCase(reviewRepository, logger);
        this.logger = logger;
    }

    addReview = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { artId } = req.params;
            const { content, rating } = req.body;
            const userId = req.user._id;

            if (!req.user.isVerified) {
                this.logger.error('User is not verified!');
                return res.status(400).json({ message: 'User is not verified!' });
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
                return res.status(400).json({ message: 'You have already reviewed this art!' });
            }

            const reviewData = {
                userId,
                artId: art._id.toString(),
                comment: content,
                rating,
            };

            const newReview = await this.reviewUseCase.createReview(reviewData);

            art.reviews.push(newReview.review._id);
            await art.save();

            const reviews = await getAverageRatings(art._id.toString());

            return res.json({ message: "Your review has been added.", reviews });
        } catch (error) {
            this.logger.error('Error adding review:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(500).json({ message: 'An unknown error occurred while adding the review.' });
        }
    };

    updateReview = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { reviewId } = req.params;
            const { content, rating } = req.body;
            const userId = req.user._id;

            if (!isValidObjectId(reviewId)) {
                return res.status(400).json({ message: 'Invalid review ID!' });
            }

            const review = await this.reviewUseCase.getReviewByUserAndId(userId, reviewId);
            if (!review) {
                return res.status(404).json({ message: 'Review not found!' });
            }

            const updatedReview = await this.reviewUseCase.updateReview(reviewId, { comment: content, rating });

            return res.json({ message: "Your review has been updated." });
        } catch (error) {
            this.logger.error('Error updating review:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(500).json({ message: 'An unknown error occurred while updating the review.' });
        }
    };

    removeReview = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { reviewId } = req.params;
            const userId = req.user._id;

            if (!isValidObjectId(reviewId)) {
                return res.status(400).json({ message: 'Invalid review ID!' });
            }

            const review = await this.reviewUseCase.getReviewByUserAndId(userId, reviewId);
            if (!review) {
                return res.status(404).json({ message: 'Review not found!' });
            }

            await this.reviewUseCase.removeReview(reviewId);

            return res.json({ message: "Review removed successfully." });
        } catch (error) {
            this.logger.error('Error removing review:', error instanceof Error ? error.message : 'Unknown error');
            return res.status(500).json({ message: 'An unknown error occurred while removing the review.' });
        }
    };

    getReviewsByArt = async (req: Request, res: Response): Promise<Response> => {
        const { artId } = req.params;
        try {
            const art = await Art.findById(artId)
                .populate({
                    path: "reviews",
                    populate: {
                        path: "owner",
                        select: "name",
                    },
                })
                .select("reviews title");

            if (!art) {
                return res.status(404).json({ message: "Art not found!" });
            }

            const reviews = art.reviews.map((r: any) => {
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

            return res.json({ art: { reviews, title: art.title } });

        } catch (error) {
            console.error('Error fetching reviews:', error);
            return res.status(500).json({ message: 'An unknown error occurred while fetching reviews.' });
        }
    };
}
