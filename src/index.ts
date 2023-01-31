import mongoose from "mongoose";
import app from './app';
import config from './config';
import { guildService } from 'tc-dbcomm'
mongoose.set("strictQuery", false);

// Connect to MongoDB
mongoose.connect(config.mongoose.serverURL)
    .then(() => {
        console.log('Connected to MongoDB!');
        // Run server
        app.listen(config.port, () => {
            console.log(`Listening on ${config.port}`);
        });
    });



async function test() {
    console.log(await guildService.fetchGuild())
}

test()

