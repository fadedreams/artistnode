export interface CreateArtistDTO {
    name: string;
    about: string;
    gender: 'male' | 'female' | 'non-binary' | 'other'; // You can extend this as needed
    avatar?: string; // Store the file name or file URL after uploading to MinIO
}

