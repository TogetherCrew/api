import express from "express";
import { auth } from '../../middlewares';
import { categoryController } from "../../controllers";


const router = express.Router();

router.get('', categoryController.getCategories);

export default router;
