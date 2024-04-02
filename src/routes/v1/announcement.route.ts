import express from 'express';
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from '../../controllers';
import RabbitMQ, { Event } from '@togethercrew.dev/tc-messagebroker';

const router = express.Router();

router.post('', validate(announcementValidation.createAnnouncement), auth('admin'), announcementController.createAnnouncement);
router.get('', validate(announcementValidation.getAnnouncements), auth('admin'), announcementController.getAnnouncements);
router.get('/:announcementId', auth('admin'), announcementController.getOneAnnouncement);
router.patch(
  '/:announcementId',
  validate(announcementValidation.updateAnnouncement),
  auth('admin'),
  announcementController.updateAnnouncement,
);
router.delete('/:announcementId', auth('admin'), announcementController.deleteAnnouncement);

RabbitMQ.onEvent(Event.SERVER_API.ANNOUNCEMENT_SAFETY_MESSAGE, announcementController.onSafetyMessageEvent);

export default router;
