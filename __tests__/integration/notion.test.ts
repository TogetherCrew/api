import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import config from '../../src/config'
setupTestDB();

describe('Notion routes', () => {
    describe('GET /api/v1/notion/databases/:databaseId', () => {
        test('should return 200 and database object if req data is ok', async () => {
            await request(app)
                .get(`/api/v1/notions/databases/${config.notion.databaseId}`)
                .send()
                .expect(httpStatus.OK);
        })
        test('should return 400 if databaseId is not valid', async () => {
            await request(app)
                .get(`/api/v1/notions/databases/databaseId`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        })
        test('should return 404 if database not found', async () => {
            await request(app)
                .get(`/api/v1/notions/databases/958a3d77051f4f7b848319819d776707`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })
        test('should return 401 if notion access token is missing', async () => {
            config.notion.apiKey = 'invalid'
            await request(app)
                .get(`/api/v1/notions/databases/databaseId`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        })
    })

});