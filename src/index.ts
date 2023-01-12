import mongoose from "mongoose";
import app from './app';
import config from './config';

mongoose.set("strictQuery", false);

console.log(config.mongoose.url)
// Connect to MongoDB
mongoose.connect(config.mongoose.url)
    .then(() => {
        console.log('Connected to MongoDB!');
        // Run server
        app.listen(config.port, () => {
            console.log(`Listening on ${config.port}`);
        });
    });
