import { Document, ObjectId, Types } from 'mongoose';
export interface CreateArtDTO {
    // CreateArtDTO: Used when creating new art
    title: string;            // Title of the art piece
    artist: string;           // Artist who created the art
    genre: string;            // Genre or category of the art
    description?: string;     // Description of the art
    year: number;             // Year of creation
    imageUrl?: string;        // Optional image URL for the art
    price?: number;           // Optional price if applicable (e.g., for sale)
    createdAt?: Date;         // Optional field for creation timestamp
    updatedAt?: Date;         // Optional field for update timestamp
}

// UpdateArtDTO: Used when updating an existing art piece
// Assuming UpdateArtDTO is defined like this
export interface UpdateArtDTO {
    title?: string;  // Optional, depending on your use case
    director?: string;
    releaseDate?: string;
    status?: string;
    type?: string;
    artcats?: string[];
    tags?: string[];
    artists?: string[];
    writers?: string[];
    poster?: any;  // Define your poster object structure here
    name?: string;  // Add missing property
    about?: string;  // Add missing property
    gender?: string;  // Add missing property
}

// SearchArtDTO: Used for searching and filtering art pieces
export interface SearchArtDTO {
    title?: string;           // Title to search for (optional)
    artist?: string;          // Artist to search for (optional)
    genre?: string;           // Genre to filter by (optional)
    year?: number;            // Year to filter by (optional)
    priceRange?: {            // Optional price range filter
        min: number;
        max: number;
    };
    pageNo?: number;          // Optional page number for pagination (default to 1)
    limit?: number;           // Optional limit for number of results per page (default to 10)
}


// Define the IArt interface with Mongoose's ObjectId

export interface IArt extends Document {
    title?: string;
    director?: Types.ObjectId;
    releaseDate?: Date;
    status?: 'public' | 'private';
    type?: string;
    artcats: string[];
    tags?: string[];
    artists: {
        artist?: Types.ObjectId;
        roleAs?: string;
        leaderArtist?: boolean;
    }[];
    writers: Types.ObjectId[];
    poster?: {
        url?: string;
        public_id?: string; // Make public_id optional
        responsive: string[];
    };
    reviews: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
export interface UpdatedArtResponse {
    success: boolean;
    updatedArt: null | IArt;
}

