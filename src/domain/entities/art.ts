export interface CreateArtDTO {
    title: string;
    director?: string;
    releaseDate?: Date;
    status?: 'public' | 'private';
    type?: string;
    artcats: string[];
    tags?: string[];
    artists?: { artist: string; roleAs: string; leaderArtist: boolean }[];
    writers?: string[];
    poster?: {
        url: string;
        public_id: string;
        responsive?: string[];
    };
}

export interface CreateArtResponse {
    success: boolean;
    art?: IArt;
    error?: string;
}

export interface UpdateArtDTO {
    name?: string;
    about?: string;
    gender?: string;
}

export interface UpdatedArtResponse {
    success: boolean;
    updatedArt?: IArt;
    error?: string;
}

export interface SearchArtDTO {
    title?: string;
    artist?: string;
    genre?: string;
}

export interface SearchArtResponse {
    success: boolean;
    arts?: IArt[];
    error?: string;
}

export interface GetLatestArtResponse {
    success: boolean;
    latestArts?: IArt[];
    error?: string;
}

export interface GetSingleArtResponse {
    success: boolean;
    art?: IArt;
    error?: string;
}

export interface GetArtResponse {
    success: boolean;
    arts?: IArt[];
    error?: string;
}

export interface IArt {
    _id: string;
    title: string;
    director?: string;
    releaseDate?: Date;
    status?: 'public' | 'private';
    type?: string;
    artcats: string[];
    tags?: string[];
    artists?: { artist: string; roleAs: string; leaderArtist: boolean }[];
    writers?: string[];
    poster?: {
        url: string;
        public_id: string;
        responsive?: string[];
    };
    reviews?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
