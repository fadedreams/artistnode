import { Document, ObjectId } from 'mongoose';

// Define the Avatar interface
export interface ArtistAvatar {
    url?: string;
    public_id?: string;
}

// Define the IArtist interface based on the structure of the artist document
export interface IArtist {
    _id?: string; // _id is a string after converting from ObjectId
    name?: string;
    about?: string;
    gender?: string;
    avatar?: ArtistAvatar;
    createdAt?: Date; // Date when the artist was created
    updatedAt?: Date; // Date when the artist was last updated
}

// Define the CreateArtistResponse interface for the response from creating an artist
export interface CreateArtistResponseSuccess {
    success?: true;
    artist?: IArtist; // The artist object if creation is successful
}

export interface CreateArtistResponseFailure {
    success?: false;
    artist?: null; // The artist object if creation is successful
    error?: string;   // Error message if creation fails
}

export interface CreateArtistResponseError {
    success?: null;
    artist?: null;   // Error message if creation fails
    error?: string;   // Just an error response with no success flag
}

// Create a union type for the different possible responses
export type CreateArtistResponse =
    | CreateArtistResponseSuccess
    | CreateArtistResponseFailure
    | CreateArtistResponseError;

export interface CreateArtistDTO {
    name?: string;
    about?: string;
    gender?: string;
    avatar?: ArtistAvatar;
}

export interface UpdateArtistDTO {
    name?: string;
    about?: string;
    gender?: string;
    avatar?: ArtistAvatar;
}

export interface SearchArtistDTO {
    name?: string;
    gender?: string;
}


export interface UpdateArtistResponse {
    success?: boolean;
    updatedArtist?: IArtist;
    error?: string;
}

export interface SearchArtistResponse {
    success?: boolean;
    artists?: IArtist[];
    error?: string;
}

export interface GetSingleArtistResponse {
    success?: boolean;
    artist?: IArtist;
    error?: string;
}

export interface GetArtistsResponse {
    success?: boolean;
    artists?: IArtist[];
    error?: string;
}


