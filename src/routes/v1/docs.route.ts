import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerDefinition from '../../docs';

const router = express.Router();

const specs = swaggerJsDoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'lib/docs/*.yml'],
});

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(specs, {
    explorer: true,
  }),
);

export default router;
