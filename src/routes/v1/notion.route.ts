import express from 'express';
import { notionController } from '../../controllers';

const router = express.Router();

router.route('/databases').get(notionController.getDatabase);

export default router;
