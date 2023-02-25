import { Response } from 'express';
import { catchAsync } from "../utils";
import { Client } from '@notionhq/client';
import config from '../config';
import { ApiError } from '../utils';

const getDatabase = catchAsync(async function (req: Request, res: Response) {
    const client = new Client({
        auth: config.notion.apiKey,
    });

    try {
        const databases = await client.databases.query({
            database_id: config.notion.databaseId,
            sorts: [{ property: "Name", direction: "ascending", }],
            filter: { property: "Active this month", checkbox: { equals: true, } }
        });
        res.send(databases);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        throw new ApiError(err.status, err.body);
    }

});

export default {
    getDatabase
}

