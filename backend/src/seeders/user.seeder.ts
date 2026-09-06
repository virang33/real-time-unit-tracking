import { Sequelize } from 'sequelize';
import User from '../models/user.model';
import { hashAsync } from '../utils/crypto.service';
import Logger from '../utils/logger.service';
import { DEFAULT_USERS } from './constants';

export const seedUsers = async (connection: Sequelize) => {
    const transaction = await connection.transaction();
    try {
        const usersToSeed = await Promise.all(
            DEFAULT_USERS.map(async (user) => {
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: await hashAsync(user.password),
                };
            })
        );

        await User.bulkCreate(usersToSeed, {
            transaction,
            updateOnDuplicate: ['name', 'email', 'password', 'updated_at']
        });

        Logger.info(`Bulk processed ${DEFAULT_USERS.length} users successfully.`);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        Logger.error("Error seeding users: ", error);
        throw error;
    }
}
