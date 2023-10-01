import { Response } from 'express';
import { guildService, userService, } from '../services';
import { IAuthRequest } from '../interfaces/request.interface';
import { ApiError, catchAsync } from "../utils";
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens';
import { Token } from '@togethercrew.dev/db';
import twitterService from '../services/twitter.service';

const disconnectTwitter = catchAsync(async function (req: IAuthRequest, res: Response) {
    const user = req.user;
    await Token.deleteMany({ user: user.discordId, type: { $in: [tokenTypes.TWITTER_ACCESS, tokenTypes.TWITTER_REFRESH] } });
    await userService.updateUserByDiscordId(user.discordId, {
        twitterId: null,
        twitterUsername: null,
        twitterProfileImageUrl: null,
        twitterConnectedAt: null
    })
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTwitter = catchAsync(async function (req: IAuthRequest, res: Response) {
    const discordId = req.user.discordId

    const guild = await guildService.getGuild({ user: discordId });
    if (!guild) {
        throw new ApiError(440, 'Oops, something went wrong! Could you please try logging in');
    }

    const user = await userService.getUserByDiscordId(discordId)
    if(!user?.twitterUsername){
        throw new ApiError(400, 'Oops, It seems you have not connected your `Twitter` account, try setup `Twitter` and try again!');
    }

    const twitterUsername = user.twitterUsername
    twitterService.twitterRefresh(twitterUsername, { discordId, guildId: guild.guildId })
    res.status(httpStatus.NO_CONTENT).send();
})

type TwitterActivityResponse = {
    posts: number | null
    replies: number | null
    retweets: number | null
    likes: number | null
    mentions: number | null
}
const activityMetrics = catchAsync(async function (req: IAuthRequest, res: Response<TwitterActivityResponse>) {
    const discordId = req.user.discordId

    const user = await userService.getUserByDiscordId(discordId)
    if(!user?.twitterId){
        throw new ApiError(400, 'Oops, It seems you have not connected your `Twitter` account, try setup `Twitter` and try again!');
    }

    // TODO: also we can make it in a way that all below functions run in parallel
    const twitterId = user.twitterId
    const postNumber = await twitterService.getUserPostNumber(twitterId)
    const replyNumber = await twitterService.getUserReplyNumber(twitterId)
    const retweetNumber = await twitterService.getUserRetweetNumber(twitterId)
    const likeNumber = await twitterService.getUserLikeNumber(twitterId)
    const mentionNumber = await twitterService.getUserMentionNumber(twitterId)
    const activityMetrics = {
        posts: postNumber,
        replies: replyNumber,
        retweets: retweetNumber,
        likes: likeNumber, 
        mentions: mentionNumber
    }
    res.send(activityMetrics)
});

type TwitterAudienceResponse = {
    replies: number | null
    retweets: number | null
    likes: number | null
    mentions: number | null
}
const audienceMetrics = catchAsync(async function (req: IAuthRequest, res: Response<TwitterAudienceResponse>) {
    const discordId = req.user.discordId

    const user = await userService.getUserByDiscordId(discordId)
    if(!user?.twitterId){
        throw new ApiError(400, 'Oops, It seems you have not connected your `Twitter` account, try setup `Twitter` and try again!');
    }

    // TODO: also we can make it in a way that all below functions run in parallel
    const twitterId = user.twitterId
    const replyNumber = await twitterService.getAudienceReplyNumber(twitterId)
    const retweetNumber = await twitterService.getAudienceRetweetNumber(twitterId)
    const likeNumber = await twitterService.getAudienceLikeNumber(twitterId)
    const mentionNumber = await twitterService.getAudienceMentionNumber(twitterId)
    const audienceMetrics = {
        replies: replyNumber,
        retweets: retweetNumber,
        likes: likeNumber,
        mentions: mentionNumber,
    }
    res.send(audienceMetrics)
});

type TwitterEngagementResponse = {
    hqla: number
    hqhe: number
    lqla: number
    lqhe: number
}
const engagementMetrics = catchAsync(async function (req: IAuthRequest, res: Response<TwitterEngagementResponse>) {
    const discordId = req.user.discordId

    const user = await userService.getUserByDiscordId(discordId)
    if(!user?.twitterId){
        throw new ApiError(400, 'Oops, It seems you have not connected your `Twitter` account, try setup `Twitter` and try again!');
    }
    const twitterId = user.twitterId

    let hqla = 0
    let hqhe = 0 
    let lqla = 0
    let lqhe = 0

    const repliesInteraction = await twitterService.getRepliesInteraction(twitterId)
    const quotesInteraction = await twitterService.getQuotesInteraction(twitterId)
    const mentionsInteraction = await twitterService.getMentionsInteraction(twitterId)

    const retweetsInteraction = await twitterService.getRetweetsInteraction(twitterId)
    const likesInteraction = await twitterService.getLikesInteraction(twitterId)

    const repliesInteractionUsers = repliesInteraction.map(ri => ri.userId)
    const quotesInteractionUsers = quotesInteraction.map(qi => qi.userId)
    const mentionsInteractionUsers = mentionsInteraction.map(mi => mi.userId)

    const retweetsInteractionUsers = retweetsInteraction.map(ri => ri.userId)
    const likesInteractionUsers = likesInteraction.map(li => li.userId)


    // calculate `hqla` and `hqhe`
    const replyQuoteMentionUsers = new Set([...repliesInteractionUsers, ...quotesInteractionUsers, ...mentionsInteractionUsers])
    for(const userId of Array.from(replyQuoteMentionUsers)){
        const replyInteraction = repliesInteraction.find(ri => ri.userId == userId)
        const quoteInteraction = quotesInteraction.find(qi => qi.userId == userId)
        const mentionInteraction = mentionsInteraction.find(mi => mi.userId == userId)

        const replyInteractionNumber = replyInteraction?.replyCount || 0
        const quoteInteractionNumber = quoteInteraction?.quoteCount || 0 
        const mentionInteractionNumber = mentionInteraction?.mentionCount || 0

        if(replyInteractionNumber + quoteInteractionNumber + mentionInteractionNumber < 3)
            hqla++
        else
            hqhe++
    }

    // calculate `lqla` and `lqhe`
    const retweetLikeUsers = new Set([...retweetsInteractionUsers, ...likesInteractionUsers])
    for(const userId of Array.from(retweetLikeUsers)){
        const retweetInteraction = retweetsInteraction.find(ri => ri.userId == userId)
        const likeInteraction = likesInteraction.find(li => li.userId == userId)
        
        const retweetInteractionNumber = retweetInteraction?.retweetCount || 0
        const likeInteractionNumber = likeInteraction?.likeCount || 0 

        if(retweetInteractionNumber + likeInteractionNumber < 3)
            lqla++
        else
            lqhe++
    }

    const engagementMetrics = {
        hqla: hqla,
        hqhe: hqhe,
        lqla: lqla,
        lqhe: lqhe,
    }
    res.send(engagementMetrics)
});

export default {
    disconnectTwitter,
    refreshTwitter,
    activityMetrics,
    audienceMetrics,
    engagementMetrics
}

