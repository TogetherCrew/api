import express from 'express';
import { auth, validate } from '../../middlewares';
import { announcementValidation } from '../../validations';
import { announcementController } from '../../controllers';
import RabbitMQ, { Event } from '@togethercrew.dev/tc-messagebroker';

const router = express.Router();

router.post(
  '/:platformId',
  auth('admin'),
  validate(announcementValidation.createAnnouncement),
  announcementController.createAnnouncement,
);
router.get(
  '/:platformId',
  auth('admin'),
  validate(announcementValidation.getAnnouncements),
  announcementController.getAnnouncements,
);
router.get(
  '/:platformId/:announcementId',
  auth('admin'),
  validate(announcementValidation.getOneAnnouncement),
  announcementController.getOneAnnouncement,
);

router.patch(
  '/:platformId/:announcementId',
  auth('admin'),
  validate(announcementValidation.updateAnnouncement),
  announcementController.updateAnnouncement,
);
router.delete(
  '/:platformId/:announcementId',
  auth('admin'),
  validate(announcementValidation.deleteAnnouncement),
  announcementController.deleteAnnouncement,
);

RabbitMQ.onEvent(Event.SERVER_API.ANNOUNCEMENT_SAFETY_MESSAGE, announcementController.onSafetyMessageEvent);

export default router;
