import express from "express";
import { twitterController } from "../../controllers";

import { auth } from '../../middlewares';
const router = express.Router();

// Router
router.post('/disconnect', auth(), twitterController.disconnectTwitter);


export default router;

