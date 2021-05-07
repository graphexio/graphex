import { default as sequelize, QueryInterface } from 'sequelize';
import { isDryRun } from '../helpers';

export default {
  up: async (queryInterface: QueryInterface, Sequelize: typeof sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.createTable(
      'user',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
      },
      { transaction, logging: console.log }
    );

    if (isDryRun()) {
      throw new Error(`Migration did not execute, running in DRY RUN mode`);
    } else {
      await transaction.commit();
    }
  },
  down: async queryInterface => {
    await queryInterface.dropTable('user');
  },
};
