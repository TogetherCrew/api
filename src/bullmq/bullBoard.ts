import { announcementQueue } from './announcement';

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullAdapter(announcementQueue)],
  serverAdapter: serverAdapter,
});

export { serverAdapter as bullBoardServerAdapter, addQueue, removeQueue, setQueues, replaceQueues };
