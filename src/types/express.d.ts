import { User } from '@src/infrastructure/persistence/models/user'; // Adjust the import path according to your project structure

declare global {
    namespace Express {
        interface Request {
            user?: User; // Add the 'user' property with the appropriate type
        }
    }
}
