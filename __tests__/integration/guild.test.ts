import request from 'supertest';
import httpStatus from 'http-status';
import moment from 'moment';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { userOne, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import { discordResponseGuildOne, guildOne, insertGuilds } from '../fixtures/guilds.fixture';
import { discordResponseChannelOne, discordResponseChannelTwo, discordResponseChannelThree, discordResponseChannelFour } from '../fixtures/channels.fixture';
import { IGuildUpdateBody } from '../../src/interfaces/guild.interface';
import { guildService } from '../../src/services';
import { Guild } from 'tc-dbcomm';
setupTestDB();

describe('Guild routes', () => {


    describe('GET /api/v1/guilds/:guildId/channels', () => {
        guildService.getGuildChannels = jest.fn().mockReturnValue([discordResponseChannelOne, discordResponseChannelTwo, discordResponseChannelThree, discordResponseChannelFour]);
        guildService.isBotAddedToGuild = jest.fn().mockReturnValue(true);
        test('should return 200 and array of channels of guild', async () => {
            await insertUsers([userOne]);
            const res = await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toEqual({
                id: discordResponseChannelTwo.id,
                title: discordResponseChannelTwo.name,
                subChannels: [discordResponseChannelFour]
            });

            expect(res.body[1]).toEqual({
                id: discordResponseChannelThree.id,
                title: discordResponseChannelThree.name,
                subChannels: [discordResponseChannelOne]
            });


        })
        test('should return 400 if bot is not added to guild', async () => {
            guildService.isBotAddedToGuild = jest.fn().mockReturnValue(false);
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        })
        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);
        })
        test('should return 401 if can not fetch guild channels', async () => {
            guildService.isBotAddedToGuild = jest.fn().mockReturnValue(true);
            await insertUsers([userOne]);
            await request(app)
                .get(`/api/v1/guilds/${discordResponseGuildOne.id}/channels`)
                .send()
                .expect(httpStatus.UNAUTHORIZED);

        })
    })

    describe('GET /api/v1/guilds/:guildId', () => {
        test('should return 200 and the guild object if data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.OK);

            expect(res.body).toEqual({
                id: guildOne._id.toHexString(),
                guildId: guildOne.guildId,
                user: userOne.discordId,
                name: guildOne.name,
                selectedChannels: []
            });
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .get(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(httpStatus.NOT_FOUND);
        })
    })

    describe('PATCH /api/v1/guilds/:guildId', () => {
        let updateBody: IGuildUpdateBody;

        beforeEach(() => {
            updateBody = {
                period: moment("2022-02-01 08:30:26.127Z").toDate(),
                selectedChannels: [
                    {
                        channelId: discordResponseChannelOne.id,
                        channelName: discordResponseChannelOne.name
                    }
                ]
            };
        });
        test('should return 200 and successfully update guild if data is ok', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            const res = await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.OK);

            expect(res.body).toMatchObject({
                id: guildOne._id.toHexString(),
                guildId: guildOne.guildId,
                user: userOne.discordId,
                name: guildOne.name,
                selectedChannels: updateBody.selectedChannels
            });

            const dbGuild = await Guild.findById(guildOne._id);
            expect(dbGuild).toBeDefined();
            expect(dbGuild).toMatchObject({ period: updateBody.period, selectedChannels: updateBody.selectedChannels });
        })

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne]);
            await insertGuilds([guildOne]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .send(updateBody)
                .expect(httpStatus.UNAUTHORIZED);
        })

        test('should return 404 if guild not found', async () => {
            await insertUsers([userOne]);

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.NOT_FOUND);
        })

        test('should return 400 if period is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { period: 10 };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 if selectedChannels is invalid', async () => {
            await insertUsers([userOne]);
            const updateBody = { selectedChannels: ':(' };

            await request(app)
                .patch(`/api/v1/guilds/${guildOne.guildId}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(httpStatus.BAD_REQUEST);
        });
    })

});