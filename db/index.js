import mongoose from 'mongoose';

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    const databaseUrl = 'mongodb://localhost:27017/artistdb1';
    // mongo-srv
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    mongoose
      .connect(databaseUrl, options)
      .then(() => {
        console.log('Connected to the database');
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
      });
  }
}

// Create a single instance of the Database class
const dbInstance = new Database();

// Export the Mongoose instance from the singleton
export default mongoose;
