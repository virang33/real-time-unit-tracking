import { Sequelize } from 'sequelize';
import User from './user.model';

/**
 * Initialize all MySQL models, associations, and hooks
 * @param connection - Sequelize instance
 */
export const initMySQLModels = (connection: Sequelize): void => {
    // Init models here
    User.initModel(connection);

    // Init associations here
    User.initAssociations();

    // Init hooks here
    User.initHooks();

};

/**
 * Export all models
 */
export {
    User
};

