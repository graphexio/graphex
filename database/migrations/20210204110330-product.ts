import { default as sequelize, QueryInterface } from 'sequelize';
import { isDryRun } from '../helpers';

export default {
  up: async (queryInterface: QueryInterface, Sequelize: typeof sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.createTable(
      'product',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        external_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
      },
      { transaction, logging: console.log },
    );

    if (isDryRun()) {
      throw new Error(`Migration did not execute, running in DRY RUN mode`);
    } else {
      await transaction.commit();
    }
  },
  down: (queryInterface) => queryInterface.dropTable('product'),
};
