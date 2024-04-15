import { Response } from 'express';
import { catchAsync } from '../utils';
import { Client, isNotionClientError, ClientErrorCode, APIErrorCode } from '@notionhq/client';
import config from '../config';
import { ApiError } from '../utils';

const getDatabase = catchAsync(async function (req: Request, res: Response) {
  const client = new Client({
    auth: config.notion.apiKey,
  });

  try {
    const databases: any = await client.databases.query({
      database_id: config.notion.databaseId,
      sorts: [{ property: 'Name', direction: 'ascending' }],
      filter: { property: 'Active this month', checkbox: { equals: true } },
    });

    const teamMembers: Array<object> = [];
    for (let i = 0; i < databases.results.length; i++) {
      teamMembers.push({
        name: databases.results[i].properties.Name.title[0]?.text?.content,
        role: databases.results[i].properties.Role.rich_text[0]?.text?.content,
        avatar: databases.results[i].properties.avatar?.files[0]?.file.url,
      });
    }
    res.send(teamMembers);
  } catch (error: unknown) {
    if (isNotionClientError(error)) {
      switch (error.code) {
        case APIErrorCode.ValidationError:
          throw new ApiError(400, 'Invalid notion database Id');
        case APIErrorCode.Unauthorized:
          throw new ApiError(401, 'Check notion API-Key');
        case APIErrorCode.ObjectNotFound:
          throw new ApiError(404, 'Notion database not found');
        case ClientErrorCode.RequestTimeout:
          throw new ApiError(500, 'Request timeout');
        default:
          throw new ApiError(500, 'Can not access to notion API');
      }
    }
  }
});

export default {
  getDatabase,
};
