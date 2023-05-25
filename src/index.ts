import mongoose from "mongoose";
import app from './app';
import config from './config';
import RabbitMQ, { MBConnection } from '@togethercrew.dev/tc-messagebroker';

mongoose.set("strictQuery", false);

// Connect to MongoDB
MBConnection.connect(config.mongoose.dbURL)
mongoose.connect(config.mongoose.serverURL)
    .then(() => {
        console.log('Connected to MongoDB!');
        // Run server
        app.listen(config.port, () => {
            console.log(`Listening on ${config.port}`);
        });
    });

RabbitMQ.connect(config.rabbitMQ.url, config.rabbitMQ.queueName).then(() => {
    console.log("Connected to RabbitMQ!")
})
