import ReviewModel from '@src/infrastructure/persistence/models/reviewModel';
import { CreateReviewDTO, UpdateReviewDTO, IReview, UpdatedReviewResponse, ReviewUpdateResult, CreateReviewResponse } from '@src/domain/entities/review';
import { Logger } from 'winston';

export class ReviewRepository {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    // Add this method to the ReviewRepository class
    async findReviewByUserAndArt(userId: string, artId: string) {
        const review = await ReviewModel.findOne({ userId, artId });
        if (!review) {
            this.logger.error('Review not found for user and art:', { userId, artId });
        }
        return review;
    }
    // Create Review
    async createReview(reviewData: CreateReviewDTO) {
        const existingReview = await ReviewModel.findOne({ artId: reviewData.artId, userId: reviewData.userId });
        if (existingReview) {
            this.logger.error('Review already exists:', { artId: reviewData.artId, userId: reviewData.userId }); // Log error if review exists
            return { error: 'Review already exists!' };
        }
        const review = new ReviewModel(reviewData);
        await review.save();
        this.logger.info('Review created:', { artId: reviewData.artId, userId: reviewData.userId }); // Log success message
        return review;
    }

    // Update Review
    async updateReview(reviewId: string, reviewData: UpdateReviewDTO) {
        try {
            const updatedReview = await ReviewModel.findByIdAndUpdate(reviewId, reviewData, { new: true });

            if (!updatedReview) {
                this.logger.error('Review not found:', reviewId);
                return { success: false, updatedReview: null };  // Return null when not found
            }

            this.logger.info('Review updated:', reviewId);
            return { success: true, updatedReview };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error('Error updating review:', error.message);
            } else {
                this.logger.error('Unknown error updating review');
            }

            return { success: false, updatedReview: null };
        }
    }

    // Remove Review
    async removeReview(reviewId: string) {
        const result = await ReviewModel.findByIdAndDelete(reviewId);
        if (!result) {
            this.logger.error('Review not found for removal:', reviewId); // Log error if review not found
            return { error: 'Review not found' };
        }
        this.logger.info('Review removed:', reviewId); // Log success message
        return { message: 'Review removed successfully' };
    }

    // Search Reviews by Art ID, User ID, or other criteria
    async searchReviews(query: SearchReviewDTO) {
        const { artId, userId, rating } = query;
        const reviews = await ReviewModel.find({
            ...(artId && { artId }),
            ...(userId && { userId }),
            ...(rating && { rating }),
        });
        this.logger.info('Search for reviews completed'); // Log search completion
        return reviews;
    }

    // Get Latest Reviews
    async getLatestReviews() {
        const latestReviews = await ReviewModel.find().sort({ createdAt: -1 }).limit(10);
        this.logger.info('Fetched latest reviews'); // Log fetching latest reviews
        return latestReviews;
    }

    // Get Single Review by ID
    async getSingleReview(reviewId: string) {
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            this.logger.error('Review not found:', reviewId); // Log error if review not found
        }
        return review;
    }

    // Get Reviews with Pagination
    async getReviews(pageNo: number, limit: number) {
        const skip = (pageNo - 1) * limit;
        const reviews = await ReviewModel.find().skip(skip).limit(limit);
        this.logger.info('Fetched paginated reviews'); // Log fetching paginated reviews
        return reviews;
    }

    // Get Reviews for Art
    async getReviewsForArt(artId: string, pageNo: number, limit: number) {
        const skip = (pageNo - 1) * limit;
        const reviews = await ReviewModel.find({ artId }).skip(skip).limit(limit);
        this.logger.info('Fetched reviews for art:', artId); // Log fetching reviews for a specific art
        return reviews;
    }
}

