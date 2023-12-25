import express from "express";
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from "../../controllers";


const router = express.Router();

router.post('', auth(), validate(announcementValidation.createAnnouncement), announcementController.createAnnouncement);


export default router;
