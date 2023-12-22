import express from "express"
import docsRoute from './docs.route';
import authRoute from './auth.route';
import userRoute from './user.route'
import heatmapRoute from './heatmap.route';
import notionRoute from './notion.route';
import memberActivityRoute from './memberActivity.route';
import communityRoute from './community.route';
import platformRoute from './platform.route';

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
        route: heatmapRoute
    },
    {
        path: '/notion',
        route: notionRoute
    },
    {
        path: '/member-activity',
        route: memberActivityRoute
    },
    {
        path: '/communities',
        route: communityRoute
    },
    {
        path: '/platforms',
        route: platformRoute
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;