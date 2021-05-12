import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'user',
        [
          {
            id: 100,
            username: 'johndoe',
          },
          {
            id: 101,
            username: 'janedoe',
          },
        ],
        { transaction }
      );

      if (process.env.MIGRATIONS_DRYRUN === 'true') {
        throw new Error(`Seed file did not execute, running in DRY RUN mode`);
      } else {
        await transaction.commit();
      }
    } catch (err) {
      transaction.rollback();
      throw err;
    }
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete('user', null, {});
  },
};
