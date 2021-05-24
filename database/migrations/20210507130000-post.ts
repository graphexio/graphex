import { default as sequelize, QueryInterface } from 'sequelize';
import { isDryRun } from '../helpers';

export default {
  up: async (queryInterface: QueryInterface, Sequelize: typeof sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.createTable(
      'post',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: Sequelize.STRING(255),
        },
        body: {
          type: Sequelize.TEXT,
        },
        owner_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        like_ids: {
          type: Sequelize.ARRAY(Sequelize.INTEGER),
          allowNull: true,
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
      },
      { transaction, logging: console.log }
    );

    if (isDryRun()) {
      throw new Error(`Migration did not execute, running in DRY RUN mode`);
    } else {
      await transaction.commit();
    }
  },
  down: queryInterface => queryInterface.dropTable('post'),
};
