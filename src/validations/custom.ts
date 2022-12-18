import { Types } from 'mongoose'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function objectId(value: any, helpers: any) {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.message('"{{#label}}" must be a valid mongo id');
    }
    return value;
}

