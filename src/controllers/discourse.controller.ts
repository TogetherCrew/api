import { Response } from 'express';
import { discourseService } from '../services';
import { IAuthAndPlatform } from '../interfaces/Request.interface';
import { catchAsync, date, charts } from '../utils';
import { DatabaseManager, Platform } from '@togethercrew.dev/db';
import moment from 'moment-timezone';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';
import { pick } from '../utils';
import { activityCompostionsTypes } from '../config/memberBreakDownTables';

const heatmapChart = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  let heatmaps = await discourseService.heatmapService.getHeatmapChart(platformConnection, req.body);
  const timeZoneOffset = parseInt(moment().tz(req.body.timeZone).format('Z'));

  if (timeZoneOffset !== 0) {
    heatmaps = date.shiftHeatmapsHours(heatmaps, timeZoneOffset);
  }
  heatmaps = charts.fillHeatmapChart(heatmaps);
  res.send(heatmaps);
});

const lineGraph = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  let lineGraph = await discourseService.heatmapService.lineGraph(
    platformConnection,
    req.body.startDate,
    req.body.endDate,
  );
  lineGraph = charts.fillHeatmapLineGraph(lineGraph, req.body.startDate, req.body.endDate);
  res.send(lineGraph);
});

const membersInteractionsNetworkGraph = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const networkGraphData = await discourseService.memberActivityService.getMembersInteractionsNetworkGraph(
    req.platform.id,
    req.platform?.name as SupportedNeo4jPlatforms,
  );
  res.send(networkGraphData);
});

const activeMembersCompositionTable = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  const activityCompostionFields =
    discourseService.memberActivityService.getActivityCompositionOfActiveMembersComposition();
  const memberActivity = await discourseService.memberActivityService.getLastDocumentForTablesUsage(
    platformConnection,
    activityCompostionFields,
  );
  const members = await discourseService.membersService.queryMembersForTables(
    platformConnection,
    filter,
    options,
    memberActivity,
    activityCompostionsTypes.activeMembersComposition,
  );
  if (members) {
    members.results.forEach((member) => {
      member.ngu = discourseService.membersService.getNgu(member);
      member.activityComposition = discourseService.memberActivityService.getActivityComposition(
        member,
        memberActivity,
        filter.activityComposition,
      );
    });
  }
  res.send(members);
});

const activeMembersOnboardingTable = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  const activityCompostionFields =
    discourseService.memberActivityService.getActivityCompositionOfActiveMembersOnboarding();
  const memberActivity = await discourseService.memberActivityService.getLastDocumentForTablesUsage(
    platformConnection,
    activityCompostionFields,
  );
  const members = await discourseService.membersService.queryMembersForTables(
    platformConnection,
    filter,
    options,
    memberActivity,
    activityCompostionsTypes.activeMembersOnboarding,
  );
  if (members) {
    members.results.forEach((member) => {
      member.ngu = discourseService.membersService.getNgu(member);
      member.activityComposition = discourseService.memberActivityService.getActivityComposition(
        member,
        memberActivity,
        filter.activityComposition,
      );
    });
  }
  res.send(members);
});

const disengagedMembersCompositionTable = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const filter = pick({ ...req.query, ...req.body }, ['activityComposition', 'ngu']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  const activityCompostionFields =
    discourseService.memberActivityService.getActivityCompositionOfDisengagedComposition();
  const memberActivity = await discourseService.memberActivityService.getLastDocumentForTablesUsage(
    platformConnection,
    activityCompostionFields,
  );
  const members = await discourseService.membersService.queryMembersForTables(
    platformConnection,
    filter,
    options,
    memberActivity,
    activityCompostionsTypes.disengagedMembersCompostion,
  );
  if (members) {
    members.results.forEach((member) => {
      member.ngu = discourseService.membersService.getNgu(member);
      member.activityComposition = discourseService.memberActivityService.getActivityComposition(
        member,
        memberActivity,
        filter.activityComposition,
      );
    });
  }
  res.send(members);
});

export default {
  heatmapChart,
  lineGraph,
  membersInteractionsNetworkGraph,
  activeMembersCompositionTable,
  activeMembersOnboardingTable,
  disengagedMembersCompositionTable,
};
