import { Op, Transaction } from 'sequelize';
import { User } from '../models/index';
import { UserPayload } from '../types/user.interfaces';
import { compareAsync } from '../utils/crypto.service';
import { responseMessages } from '../utils/response-message.service';

const userAttributes = ['id', 'name', 'email', 'mobile'];

const findUserByEmail = async (email: string) => {
    return await User.findOne({ where: { email, is_deleted: false }, attributes: [...userAttributes, 'password'] });
};

const findUserById = async (userId: string) => {
    return await User.findOne({ where: { id: userId, is_deleted: false }, attributes: [...userAttributes, 'address', 'created_at', 'updated_at'] });
};

const updateUser = async (userId: string, updateData: UserPayload, updatedBy?: string | null, transaction?: Transaction) => {
    await User.update(
        {
            ...updateData,
            updated_at: new Date(),
            ...(updatedBy && { updated_by: updatedBy })
        },
        { where: { id: userId, is_deleted: false }, transaction }
    );
};

/** Create a new user */
const createUser = async (userData: UserPayload, createdBy?: string | null, transaction?: Transaction) => {
    return await User.create({
        ...userData,
        ...(createdBy && { created_by: createdBy }),
    }, { transaction });
};

/** Login with email and password */
const loginWithEmailAndPassword = async (email: string, password: string) => {
    const user = await findUserByEmail(email);
    if (!user || !user.password) {
        return { error: responseMessages.authentication.invalidEmailOrPassword } as const;
    }

    const isPasswordValid = await compareAsync(password, user.password);
    if (!isPasswordValid) {
        return { error: responseMessages.authentication.invalidEmailOrPassword } as const;
    }

    return user;
};

export default {
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    loginWithEmailAndPassword,
};