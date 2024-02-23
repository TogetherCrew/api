import express from "express";
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from "../../controllers";
import RabbitMQ, { Event } from "@togethercrew.dev/tc-messagebroker";


const router = express.Router();

router.post('', auth(), validate(announcementValidation.createAnnouncement), announcementController.createAnnouncement);
router.get('', auth(), validate(announcementValidation.getAnnouncements), announcementController.getAnnouncements);
router.get('/:announcementId', auth(), announcementController.getOneAnnouncement);
router.patch('/:announcementId', auth(), validate(announcementValidation.updateAnnouncement), announcementController.updateAnnouncement);
router.delete('/:announcementId', auth(), announcementController.deleteAnnouncement);

RabbitMQ.onEvent(Event.SERVER_API.ANNOUNCEMENT_SAFETY_MESSAGE, announcementController.onSafetyMessageEvent);


export default router;
