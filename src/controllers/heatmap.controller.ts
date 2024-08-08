import { Response } from 'express';
import { heatmapService } from '../services';
import { IAuthAndPlatform } from '../interfaces/Request.interface';
import { catchAsync, date, charts } from '../utils';
import { DatabaseManager } from '@togethercrew.dev/db';
import moment from 'moment-timezone';

const heatmapChart = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  if (req.body.channelIds.length === 0) {
    return res.send(charts.fillHeatmapChart([]));
  }
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  console.log(await platformConnection.models.HeatMap.find({}));
  let heatmaps = await heatmapService.getHeatmapChart(platformConnection, req.body);
  const timeZoneOffset = parseInt(moment().tz(req.body.timeZone).format('Z'));

  if (timeZoneOffset !== 0) {
    heatmaps = date.shiftHeatmapsHours(heatmaps, timeZoneOffset);
  }
  heatmaps = charts.fillHeatmapChart(heatmaps);
  res.send(heatmaps);
});

const lineGraph = catchAsync(async function (req: IAuthAndPlatform, res: Response) {
  const platformConnection = await DatabaseManager.getInstance().getPlatformDb(req.platform?.id);
  console.log(await platformConnection.models.HeatMap.find({}));
  let lineGraph = await heatmapService.lineGraph(platformConnection, req.body.startDate, req.body.endDate);
  lineGraph = charts.fillHeatmapLineGraph(lineGraph, req.body.startDate, req.body.endDate);
  res.send(lineGraph);
});

export default {
  heatmapChart,
  lineGraph,
};
