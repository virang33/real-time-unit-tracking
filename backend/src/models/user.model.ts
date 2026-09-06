import { DataTypes, Model, Sequelize } from 'sequelize';

export class User extends Model {
    declare id: string;
    declare name: string | null;
    declare email: string | null;
    declare password: string | null;
    declare mobile: string | null;
    declare address: string | null;
    declare is_deleted: boolean;
    declare created_by: string | null;
    declare updated_by: string | null;
    declare deleted_by: string | null;
    declare created_at: Date;
    declare updated_at: Date;
    declare deleted_at: Date | null;

    static initModel(connection: Sequelize): void {
        User.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                email: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                mobile: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                },
                address: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                password: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                is_deleted: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                created_by: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                updated_by: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                deleted_by: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                deleted_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
            },
            {
                tableName: 'users',
                sequelize: connection,
                freezeTableName: true,
                timestamps: true,
                createdAt: 'created_at',
                updatedAt: 'updated_at',
            }
        );
    }

    static initAssociations(): void {

    }

    static initHooks(): void {
    }
}

export default User;
