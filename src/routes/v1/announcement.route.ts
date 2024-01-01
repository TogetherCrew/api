import express from "express";
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from "../../controllers";


const router = express.Router();

router.post('', auth(), validate(announcementValidation.createAnnouncement), announcementController.createAnnouncement);
router.get('', auth(), validate(announcementValidation.getAnnouncements), announcementController.getAnnouncements);
router.get('/:announcementId', auth(), announcementController.getOneAnnouncement);

export default router;
