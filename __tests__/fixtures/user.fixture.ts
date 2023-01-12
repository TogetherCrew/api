import { Types } from "mongoose"
import { User } from 'tc-dbcomm';


export const userOne = {
    _id: new Types.ObjectId(),
    discordId: "681946187490000900",
    email: "some@yahoo.com",
    verified: false,
    avatar: '947f3e19e6e36a2679c6fe854b79a615',
};

export const userTwo = {
    _id: new Types.ObjectId(),
    discordId: "681946187490000901",
    email: "some@gmail.com",
    verified: false,
    avatar: '947f3e19e6e36a2679c6fe854b79a615',
};



export const insertUsers = async function <Type>(users: Array<Type>) {
    await User.insertMany(users.map((user) => (user)));
};