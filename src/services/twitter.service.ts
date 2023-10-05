import utils from '../utils/date';
import * as Neo4j from '../neo4j';
import sagaService from '../services/saga.service';

async function twitterRefresh(twitterUsername: string, other: { discordId: string; guildId: string }) {
  const saga = sagaService.createAndStartRefreshTwitterSaga(twitterUsername, {
    ...other,
    message:
      'Your Twitter analysis has been completed. See the insights in your TogetherCrew dashboard https://app.togethercrew.com/',
  });

  return saga;
}

//#region Activity Metrics
async function getUserPostNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const userPostNumberQuery = `
        MATCH (a:TwitterAccount  {userId: '${twitterId}'} )-[r:TWEETED]->(t:Tweet) 
        WHERE r.createdAt >= ${sevenDaysAgoEpoch}
        RETURN COUNT(r) as post_count
    `;
  const neo4jData = await Neo4j.read(userPostNumberQuery);
  const { records: postNumberRecords } = neo4jData;
  if (postNumberRecords.length == 0) return null;

  const postNumberRecord = postNumberRecords[0];
  const { _fieldLookup, _fields } = postNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const postNumber = _fields[_fieldLookup['post_count']];
  return postNumber;
}

async function getUserReplyNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const userReplyNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} )-[r:REPLIED]->(m:Tweet)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND m.authorId <> t.authorId
        RETURN COUNT(r) as reply_count
    `;
  const neo4jData = await Neo4j.read(userReplyNumberQuery);
  const { records: replyNumberRecords } = neo4jData;
  if (replyNumberRecords.length == 0) return null;

  const replyNumberRecord = replyNumberRecords[0];
  const { _fieldLookup, _fields } = replyNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const replyNumber = _fields[_fieldLookup['reply_count']];
  return replyNumber;
}

async function getUserRetweetNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const userRetweetNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} )-[r:RETWEETED]->(m:Tweet)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND m.authorId <> t.authorId
        RETURN COUNT(r) as retweet_count
    `;
  const neo4jData = await Neo4j.read(userRetweetNumberQuery);
  const { records: retweetNumberRecords } = neo4jData;
  if (retweetNumberRecords.length == 0) return null;

  const retweetNumberRecord = retweetNumberRecords[0];
  const { _fieldLookup, _fields } = retweetNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const retweetNumber = _fields[_fieldLookup['retweet_count']];
  return retweetNumber;
}

async function getUserLikeNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const userLikeNumberQuery = `
        MATCH (a:TwitterAccount  {userId: '${twitterId}'} )-[r:LIKED]->(m:Tweet)
        WHERE m.createdAt >= ${sevenDaysAgoEpoch} AND a.userId <> m.authorId
        RETURN COUNT(r) as like_counts
    `;
  const neo4jData = await Neo4j.read(userLikeNumberQuery);
  const { records: likeNumberRecords } = neo4jData;
  if (likeNumberRecords.length == 0) return null;

  const likeNumberRecord = likeNumberRecords[0];
  const { _fieldLookup, _fields } = likeNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const linkNumber = _fields[_fieldLookup['like_counts']];
  return linkNumber;
}

async function getUserMentionNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const userMentionNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} )-[r:MENTIONED]->(a:TwitterAccount)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND t.authorId <> a.userId
        RETURN COUNT(r) as mention_count
    `;
  const neo4jData = await Neo4j.read(userMentionNumberQuery);
  const { records: mentionNumberRecords } = neo4jData;
  if (mentionNumberRecords.length == 0) return null;

  const mentionNumberRecord = mentionNumberRecords[0];
  const { _fieldLookup, _fields } = mentionNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const mentionNumber = _fields[_fieldLookup['mention_count']];
  return mentionNumber;
}
//#endregion

//#region Audience Metrics

/**
 * Number of replies others made on the user's posts
 * @param twitterId id of a user
 */
async function getAudienceReplyNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const replyNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} )<-[r:REPLIED]-(m:Tweet)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND m.authorId <> t.authorId
        RETURN COUNT(r) as reply_count
    `;

  const neo4jData = await Neo4j.read(replyNumberQuery);
  const { records: replyNumberRecords } = neo4jData;
  if (replyNumberRecords.length == 0) return null;

  const replyNumberRecord = replyNumberRecords[0];
  const { _fieldLookup, _fields } = replyNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const replyNumber = _fields[_fieldLookup['reply_count']];
  return replyNumber;
}

/**
 * Number of retweets others made on the user's posts
 * @param twitterId id of a user
 */
async function getAudienceRetweetNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const retweetNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} )<-[r:RETWEETED]-(m:Tweet)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND m.authorId <> t.authorId
        RETURN COUNT(r) as retweet_count
    `;

  const neo4jData = await Neo4j.read(retweetNumberQuery);
  const { records: retweetNumberRecords } = neo4jData;
  if (retweetNumberRecords.length == 0) return null;

  const retweetNumberRecord = retweetNumberRecords[0];
  const { _fieldLookup, _fields } = retweetNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const retweetNumber = _fields[_fieldLookup['retweet_count']];
  return retweetNumber;
}

/**
 * Number of likes others made on the user's posts
 * @param twitterId id of a user
 */
async function getAudienceLikeNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const likeNumberQuery = `
        MATCH (t:Tweet  {authorId: '${twitterId}'} ) <-[r:LIKED]- (a:TwitterAccount)
        WHERE t.createdAt >= ${sevenDaysAgoEpoch} AND a.userId <> t.authorId
        RETURN COUNT(r) as like_counts
    `;

  const neo4jData = await Neo4j.read(likeNumberQuery);
  const { records: likeNumberRecords } = neo4jData;
  if (likeNumberRecords.length == 0) return null;

  const likeNumberRecord = likeNumberRecords[0];
  const { _fieldLookup, _fields } = likeNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const linkNumber = _fields[_fieldLookup['like_counts']];
  return linkNumber;
}

/**
 * Number of Mentions a user received
 * @param twitterId id of a user
 */
async function getAudienceMentionNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const mentionNumberQuery = `
        MATCH (a:TwitterAccount  {userId: '${twitterId}'} )<-[r:MENTIONED]-(t:Tweet)
        WHERE r.createdAt >= ${sevenDaysAgoEpoch} AND a.userId <> t.authorId
        RETURN COUNT(r) as mention_count
    `;

  const neo4jData = await Neo4j.read(mentionNumberQuery);
  const { records: mentionNumberRecords } = neo4jData;
  if (mentionNumberRecords.length == 0) return null;

  const mentionNumberRecord = mentionNumberRecords[0];
  const { _fieldLookup, _fields } = mentionNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const mentionNumber = _fields[_fieldLookup['mention_count']];
  return mentionNumber;
}

//#endregion

//#region Engagement Metrics

type ReplyInteraction = { userId: string; replyCount: number };
async function getRepliesInteraction(twitterId: string): Promise<ReplyInteraction[]> {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const repliesInteractionQuery = `
        MATCH (t:Tweet {authorId: '${twitterId}'})<-[r:REPLIED]-(m:Tweet)
        WHERE m.authorId <> t.authorId AND r.createdAt >= ${sevenDaysAgoEpoch}
        RETURN m.authorId AS user, COUNT(*) as reply_count
    `;

  const neo4jData = await Neo4j.read(repliesInteractionQuery);
  const { records: replyNumberRecords } = neo4jData;
  if (replyNumberRecords.length == 0) return [];

  const repliesInteraction: ReplyInteraction[] = replyNumberRecords.map((replyNumberRecord) => {
    const { _fieldLookup, _fields } = replyNumberRecord as unknown as {
      _fieldLookup: Record<string, number>;
      _fields: number[];
    };
    const userId = _fields[_fieldLookup['user']] as unknown as string;
    const replyCount = _fields[_fieldLookup['reply_count']] as number;

    return { userId, replyCount };
  });

  return repliesInteraction;
}

type QuoteInteraction = { userId: string; quoteCount: number };
async function getQuotesInteraction(twitterId: string): Promise<QuoteInteraction[]> {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const quotesInteractionQuery = `
        MATCH (t:Tweet {authorId: '${twitterId}'})<-[r:QUOTED]-(m:Tweet)
        WHERE m.authorId <> t.authorId AND r.createdAt >= ${sevenDaysAgoEpoch}
        RETURN m.authorId AS user, COUNT(*) as quote_count
    `;

  const neo4jData = await Neo4j.read(quotesInteractionQuery);
  const { records: quoteNumberRecords } = neo4jData;
  if (quoteNumberRecords.length == 0) return [];

  const quotesInteraction: QuoteInteraction[] = quoteNumberRecords.map((quoteNumberRecord) => {
    const { _fieldLookup, _fields } = quoteNumberRecord as unknown as {
      _fieldLookup: Record<string, number>;
      _fields: number[];
    };
    const userId = _fields[_fieldLookup['user']] as unknown as string;
    const quoteCount = _fields[_fieldLookup['quote_count']] as number;

    return { userId, quoteCount };
  });

  return quotesInteraction;
}

type MentionInteraction = { userId: string; mentionCount: number };
async function getMentionsInteraction(twitterId: string): Promise<MentionInteraction[]> {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const mentionsInteractionQuery = `
        MATCH (a:TwitterAccount {userId: '${twitterId}'})<-[r:MENTIONED]-(t:Tweet)
        WHERE a.userId <> t.authorId AND r.createdAt >= ${sevenDaysAgoEpoch}
        RETURN t.authorId AS user, COUNT (*) as mention_count
    `;

  const neo4jData = await Neo4j.read(mentionsInteractionQuery);
  const { records: mentionNumberRecords } = neo4jData;
  if (mentionNumberRecords.length == 0) return [];

  const mentionsInteraction: MentionInteraction[] = mentionNumberRecords.map((mentionNumberRecord) => {
    const { _fieldLookup, _fields } = mentionNumberRecord as unknown as {
      _fieldLookup: Record<string, number>;
      _fields: number[];
    };
    const userId = _fields[_fieldLookup['user']] as unknown as string;
    const mentionCount = _fields[_fieldLookup['mention_count']] as number;

    return { userId, mentionCount };
  });

  return mentionsInteraction;
}

type RetweetInteraction = { userId: string; retweetCount: number };
async function getRetweetsInteraction(twitterId: string): Promise<RetweetInteraction[]> {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const retweetsInteractionQuery = `
        MATCH (t:Tweet {authorId: '${twitterId}'})<-[r:RETWEETED]-(m:Tweet)
        WHERE t.authorId <> m.authorId AND r.createdAt >= ${sevenDaysAgoEpoch}
        RETURN m.authorId AS user, COUNT (*) as retweet_count
    `;

  const neo4jData = await Neo4j.read(retweetsInteractionQuery);
  const { records: retweetNumberRecords } = neo4jData;
  if (retweetNumberRecords.length == 0) return [];

  const retweetsInteraction: RetweetInteraction[] = retweetNumberRecords.map((retweetNumberRecord) => {
    const { _fieldLookup, _fields } = retweetNumberRecord as unknown as {
      _fieldLookup: Record<string, number>;
      _fields: number[];
    };
    const userId = _fields[_fieldLookup['user']] as unknown as string;
    const retweetCount = _fields[_fieldLookup['retweet_count']] as number;

    return { userId, retweetCount };
  });

  return retweetsInteraction;
}

type LikeInteraction = { userId: string; likeCount: number };
async function getLikesInteraction(twitterId: string): Promise<LikeInteraction[]> {
  const userLikeNumberInteractionQuery = `
        MATCH (t:Tweet {authorId: '${twitterId}'}) <-[:LIKED]- (a:TwitterAccount)
        WHERE a.userId <> t.authorId
        RETURN a.userId AS user, COUNT(*) as likes_count
    `;

  const neo4jData = await Neo4j.read(userLikeNumberInteractionQuery);
  const { records: likeNumberRecords } = neo4jData;
  if (likeNumberRecords.length == 0) return [];

  const likesInteraction: LikeInteraction[] = likeNumberRecords.map((likeNumberRecord) => {
    const { _fieldLookup, _fields } = likeNumberRecord as unknown as {
      _fieldLookup: Record<string, number>;
      _fields: number[];
    };
    const userId = _fields[_fieldLookup['user']] as unknown as string;
    const likeCount = _fields[_fieldLookup['likes_count']] as number;

    return { userId, likeCount };
  });

  return likesInteraction;
}

//#endregion

//#region Account Metrics

async function getUserFollowerNumber(twitterId: string) {
  const userFollowerNumberQuery = `
        MATCH (a:TwitterAccount {userId: '${twitterId}'})
        RETURN a.followerCount as follower_count
    `;
  const neo4jData = await Neo4j.read(userFollowerNumberQuery);
  const { records: followerNumberRecords } = neo4jData;
  if (followerNumberRecords.length == 0) return null;

  const followerNumberRecord = followerNumberRecords[0];
  const { _fieldLookup, _fields } = followerNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const followerNumber = _fields[_fieldLookup['follower_count']];
  return followerNumber;
}

/**
 * Number of accounts that engages with you
 * @param twitterId id of a user
 */
async function getEngagementNumber(twitterId: string) {
  const sevenDaysAgoEpoch = utils.get7daysAgoUTCtimestamp();

  const engagementNumberQuery = `
        OPTIONAL MATCH (t:Tweet {authorId: '${twitterId}'})<-[r:QUOTED|REPLIED|RETWEETED]-(m:Tweet)
        WHERE m.authorId <> t.authorId AND r.createdAt >= ${sevenDaysAgoEpoch}
        WITH COLLECT(DISTINCT m.authorId) as interaction_authors
        
        OPTIONAL MATCH (a:TwitterAccount {userId: '${twitterId}'}) <-[r:MENTIONED]-(t:Tweet)
        WHERE t.authorId <> a.userId AND r.createdAt >= ${sevenDaysAgoEpoch}
        WITH COLLECT(DISTINCT t.authorId) as mention_authors, interaction_authors
        
        OPTIONAL MATCH (t:Tweet {authorId: '${twitterId}'}) <-[r:LIKED]-(a:TwitterAccount)
        WHERE t.authorId <> a.userId AND t.createdAt >= ${sevenDaysAgoEpoch}
        WITH COLLECT(DISTINCT a.userId) as liked_authors, mention_authors, interaction_authors
        
        WITH liked_authors + interaction_authors + mention_authors as people_list
        UNWIND people_list as people
        RETURN COUNT( DISTINCT people) as account_count
    `;

  const neo4jData = await Neo4j.read(engagementNumberQuery);
  const { records: engagementNumberRecords } = neo4jData;
  if (engagementNumberRecords.length == 0) return null;

  const engagementNumberRecord = engagementNumberRecords[0];
  const { _fieldLookup, _fields } = engagementNumberRecord as unknown as {
    _fieldLookup: Record<string, number>;
    _fields: number[];
  };

  const engagementNumber = _fields[_fieldLookup['account_count']];
  return engagementNumber;
}

//#endregion

export default {
  twitterRefresh,

  // Activity Metrics
  getUserPostNumber,
  getUserReplyNumber,
  getUserRetweetNumber,
  getUserLikeNumber,
  getUserMentionNumber,

  // Audience Metrics
  getAudienceReplyNumber,
  getAudienceRetweetNumber,
  getAudienceLikeNumber,
  getAudienceMentionNumber,

  // Engagement Metrics
  getRepliesInteraction,
  getQuotesInteraction,
  getMentionsInteraction,
  getRetweetsInteraction,
  getLikesInteraction,

  // Account Metrics
  getUserFollowerNumber,
  getEngagementNumber,
};
