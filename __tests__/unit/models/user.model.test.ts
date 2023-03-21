import { User, IUser } from 'tc_dbcomm';

describe('User model', () => {
    describe('User validation', () => {
        let user: IUser;
        beforeEach(() => {
            user = {
                discordId: "681946187490000906",
            };
        });

        test('should correctly validate a valid user', async () => {
            await expect(new User(user).validate()).resolves.toBeUndefined();
        });

        test('should throw a validation error if email is invalid', async () => {
            user.email = 'invalidEmail';
            await expect(new User(user).validate()).rejects.toThrow();
        });
    });
});