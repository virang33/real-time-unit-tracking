import { Sequelize } from 'sequelize';
import Logger from '../utils/logger.service';
import { seedUsers } from './user.seeder';

/**
 * Run all seeders
 */
export const runAllSeeders = async (connection: Sequelize): Promise<void> => {
    try {
        Logger.info('Starting database seeders...');

        await seedUsers(connection);

        Logger.info('All database seeders completed successfully.');
    } catch (error) {
        Logger.error(`Error running seeders: ${error}`);
        throw error;
    }
};
