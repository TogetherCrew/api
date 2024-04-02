import express from 'express';
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from '../../controllers';
import RabbitMQ, { Event } from '@togethercrew.dev/tc-messagebroker';

const router = express.Router();

router.post('', validate(announcementValidation.createAnnouncement), auth(), announcementController.createAnnouncement);
router.get('', validate(announcementValidation.getAnnouncements), auth(), announcementController.getAnnouncements);
router.get('/:announcementId', auth(), announcementController.getOneAnnouncement);
router.patch(
  '/:announcementId',
  validate(announcementValidation.updateAnnouncement),
  auth(),
  announcementController.updateAnnouncement,
);
router.delete('/:announcementId', auth(), announcementController.deleteAnnouncement);

RabbitMQ.onEvent(Event.SERVER_API.ANNOUNCEMENT_SAFETY_MESSAGE, announcementController.onSafetyMessageEvent);

export default router;
