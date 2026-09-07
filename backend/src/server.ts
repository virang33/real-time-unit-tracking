import 'dotenv/config';
import { createServer } from 'http';
import { Sequelize } from 'sequelize';
import { App } from './app';
import { initializeDatabase } from './config/database';
import { initMySQLModels } from './models';
import { runAllSeeders } from './seeders';
import Logger from './utils/logger.service';
import env from './utils/validate-env';

const app = new App();
const port = env.PORT;

// Create HTTP server
const httpServer = createServer(app.express);

export let sequelize: Sequelize;

(async () => {
    try {
        // Initialize database connection
        sequelize = await initializeDatabase();

        // Initialize models, associations, and hooks
        initMySQLModels(sequelize);
        Logger.info('Models, associations, and hooks initialized successfully.');

        await sequelize.sync({ alter: false });
        Logger.info('Database and models synchronized successfully.');

        // Seed default data
        if (env.SEED) {
            await runAllSeeders(sequelize);
            Logger.info('Database seeders completed successfully.');
        } else {
            Logger.info('Database seeders skipped.');
        }
    } catch (err) {
        Logger.error('MySQL database is not connected (continuing with live-data in-memory mode):', err);
    }

    // Start the server
    httpServer.listen(port, async () => {
        Logger.info(`Server is running on port ${port}... 🚀🚀`);
    });
})();