import mongoose from "mongoose";
import config from "../../src/config";
import RabbitMQ, { MBConnection, Queue } from '@togethercrew.dev/tc-messagebroker';
import Redis from 'ioredis';
const setupTestDB = () => {
    beforeAll(async () => {
        mongoose.set("strictQuery", false);
        await mongoose.connect(config.mongoose.serverURL);
        await MBConnection.connect(config.mongoose.dbURL);
        RabbitMQ.connect(config.rabbitMQ.url, Queue.SERVER_API)
    });

    beforeEach(async () => {
        await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany({})));
    });

    afterAll(async () => {
        await mongoose.disconnect();
        const redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
        });
        await redis.disconnect();
    });
};

export default setupTestDB;