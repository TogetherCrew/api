import { Response } from 'express';
import { discourseService } from '../services';
import { IAuthAndPlatform } from '../interfaces/Request.interface';
import { catchAsync, date, charts } from '../utils';
import { DatabaseManager, Platform } from '@togethercrew.dev/db';
import moment from 'moment-timezone';
import { SupportedNeo4jPlatforms } from '../types/neo4j.type';
import passport, { use } from 'passport';
import httpStatus from 'http-status';
import { ApiError, roleUtil, pick } from '../utils';
import { communityService, platformService, moduleService } from '../services';
import { Types } from 'mongoose';
import { UserRole } from '../interfaces';

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

export default {
  heatmapChart,
  lineGraph,
  membersInteractionsNetworkGraph,
};
