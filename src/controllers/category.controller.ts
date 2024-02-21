import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync } from "../utils";
import categoryService from '../services/category.service';

const getCategories = catchAsync(async function (req: IAuthRequest, res: Response) {
    const categories = await categoryService.getCategories();
    res.send(categories);
});

export default {
    getCategories
}
