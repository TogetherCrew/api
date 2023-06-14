import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import config from '../../src/config'
setupTestDB();

describe('Notion routes', () => {
    // beforeEach(() => {
    //     jest.resetModules()
    // });

    describe('GET /api/v1/notion/databases', () => {
        test('should return 200 and database object if req data is ok', async () => {
            await request(app)
                .get(`/api/v1/notion/databases`)
                .send()
                .expect(httpStatus.OK);
        })
        test('should return 400 if databaseId is not valid', async () => {
            config.notion.databaseId = 'A';
            await request(app)
                .get(`/api/v1/notion/databases`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        })
        test('should return 404 if database not found', async () => {
            config.notion.databaseId = '958a3d77051f4f7b848319819d776708'
            await request(app)
                .get(`/api/v1/notion/databases`)
                .send()
                .expect(httpStatus.NOT_FOUND);
        })
        test('should return 401 if notion access token is missing', async () => {
            config.notion.apiKey = 'invalid'
            await request(app)
                .get(`/api/v1/notion/databases`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })
});