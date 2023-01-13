import express from "express"
import docsRoute from './docs.route';
import authRoute from './auth.route';
import guildsRoute from './guilds.route';
import usersRoute from './users.route'

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
        path: '/guilds',
        route: guildsRoute,
    },
    {
        path: '/users',
        route: usersRoute,
    }
];


defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;