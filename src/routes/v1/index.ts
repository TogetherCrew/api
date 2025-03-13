import express from 'express';

import announcementRoute from './announcement.route';
import authRoute from './auth.route';
import categoryRoute from './category.route';
import communityRoute from './community.route';
import discourseRoute from './discourse.route';
import docsRoute from './docs.route';
import heatmapRoute from './heatmap.route';
import hivemindRoute from './hivemind.route';
import memberActivityRoute from './memberActivity.route';
import moduleRoute from './module.route';
import notionRoute from './notion.route';
import platformRoute from './platform.route';
import telegramRoute from './telegram.route';
import userRoute from './user.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/docs',
    route: docsRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },

  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/heatmaps',
    route: heatmapRoute,
  },
  {
    path: '/notion',
    route: notionRoute,
  },
  {
    path: '/member-activity',
    route: memberActivityRoute,
  },
  {
    path: '/communities',
    route: communityRoute,
  },
  {
    path: '/platforms',
    route: platformRoute,
  },
  {
    path: '/announcements',
    route: announcementRoute,
  },
  {
    path: '/categories',
    route: categoryRoute,
  },
  {
    path: '/modules',
    route: moduleRoute,
  },
  {
    path: '/discourse',
    route: discourseRoute,
  },
  {
    path: '/telegram',
    route: telegramRoute,
  },
  {
    path: '/hivemind',
    route: hivemindRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
