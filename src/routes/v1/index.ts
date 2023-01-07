import express from "express"
import docsRoute from './docs.route';
import authRoute from './auth.route';

const router = express.Router();

const defaultRoutes = [
    {
        path: '/docs',
        route: docsRoute,
    },
    {
        path: '/auth',
        route: authRoute,
    }
];



defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;