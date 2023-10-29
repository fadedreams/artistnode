import mongoose from 'mongoose';

const databaseUrl = 'mongodb://localhost/artistdb1'; // Replace with your actual database URL
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

export default mongoose; // Export the Mongoose instance


