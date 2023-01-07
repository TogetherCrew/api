import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, userTwo, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { discordResponseGuildOne, discordResponseGuildTwo } from '../fixtures/guilds.fixture';
import { IUserUpdateBody } from '../../src/interfaces/user.interface';
import { userService, tokenService } from '../../src/services';
import { User } from 'tc-dbcomm';
setupTestDB();

describe('User routes', () => {
    userService.getCurrentUserGuilds = jest.fn().mockReturnValue([discordResponseGuildOne, discordResponseGuildTwo]);
    tokenService.getDiscordAuth = jest.fn().mockReturnValue({ access: { token: "681946187490000900" } });

    describe('GET /api/v1/users/@me/guilds-with-admin-role', () => {
        test('should return 200 and array of guilds that user has admin role in them', async () => {
            await insertUsers([userOne]);
            const res = await request(app)
                .get('/api/v1/users/@me/guilds-with-admin-role')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].name).toBe(discordResponseGuildOne.name);
        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get('/api/v1/users/@me/guilds-with-admin-role')
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
    })



    describe('PATCH /api/v1/users/@me', () => {
        let updateBody: IUserUpdateBody;

        beforeEach(() => {
            updateBody = {
                email: "email@yahoo.com"
            };
        });
        test('should return 200 and successfully update user if data is ok', async () => {
            await insertUsers([userOne]);
            const res = await request(app)
                .patch('/api/v1/users/@me')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                id: userOne._id.toHexString(),
                discordId: userOne.discordId,
                email: updateBody.email,
                verified: userOne.verified,
                avatar: userOne.avatar,
            });

            const dbUser = await User.findById(userOne._id);
            expect(dbUser).toBeDefined();
            expect(dbUser).toMatchObject({ email: updateBody.email });
        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .patch('/api/v1/users/@me')
                .send(updateBody)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 400 if email is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { email: 'invalidEmail' };

            await request(app)
                .patch('/api/v1/users/@me')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 if email is already taken', async () => {
            await insertUsers([userOne, userTwo]);
            const updateBody = { email: userTwo.email };

            await request(app)
                .patch('/api/v1/users/@me')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should not return 200 if email is my email', async () => {
            await insertUsers([userOne]);
            const updateBody = { email: userOne.email };

            await request(app)
                .patch('/api/v1/users/@me')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);
        });
    })

});