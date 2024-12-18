// CreateArtDTO: Used when creating new art
export interface CreateArtDTO {
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
export interface UpdateArtDTO {
    title?: string;           // Title of the art piece (optional for update)
    artist?: string;          // Artist (optional for update)
    genre?: string;           // Genre (optional for update)
    description?: string;     // Description (optional for update)
    year?: number;            // Year of creation (optional for update)
    imageUrl?: string;        // Optional image URL (for update)
    price?: number;           // Optional price for update
    updatedAt?: Date;         // Timestamp for when the art was last updated
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

