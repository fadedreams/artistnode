// artist.ts (DTO definitions)

export interface CreateArtistDTO {
    name: string;
    about: string;
    gender: 'male' | 'female' | 'non-binary' | 'other'; // You can extend this as needed
    avatar?: string; // Store the file name or file URL after uploading to MinIO
}

export interface UpdateArtistDTO {
    name?: string; // Optional in case not all fields need to be updated
    about?: string;
    gender?: 'male' | 'female' | 'non-binary' | 'other';
    avatar?: string; // Updated avatar (if file is uploaded)
}

export interface SearchArtistDTO {
    name?: string; // Optional, to search by name
    gender?: 'male' | 'female' | 'non-binary' | 'other'; // Optional filter by gender
    about?: string; // Optional, to search by a part of the about text
}

export interface GetSingleArtistDTO {
    id: string; // The artist's ID
}

export interface GetActorsDTO {
    role: 'actor'; // Role filter, assuming we want to fetch artists who are actors
}

