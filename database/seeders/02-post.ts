import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // test if seed was already ran
    await queryInterface.sequelize
      .query('SELECT count(*) FROM post')
      .then(res => {
        if (res.length > 0) {
          throw new Error('Seed for post was already ran');
        }
      });

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'post',
        [
          {
            title: 'My First Post',
            body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nec semper nulla, ac porta eros. 
                    Sed nunc tellus, bibendum non interdum nec, pellentesque nec risus. 
                    Nam ut orci sit amet leo lacinia rhoncus luctus ac augue. Nam sit amet venenatis sem. 
                    Aliquam mollis volutpat nulla et iaculis. Nulla facilisi. In hac habitasse platea dictumst.`,
            owner_id: 100,
          },
          {
            title: 'My Second Post',
            body: `Proin ex est, auctor sit amet libero nec, laoreet elementum odio. 
                    Donec nunc sem, egestas semper dolor varius, aliquam fermentum felis. Suspendisse 
                    volutpat nibh euismod, rhoncus metus non, feugiat tellus. Suspendisse congue est est, 
                    non auctor arcu egestas quis. Phasellus ornare egestas varius. Morbi bibendum ipsum nec enim 
                    venenatis volutpat. Cras enim massa, commodo nec auctor id, ultricies ut ante. `,
            owner_id: 100,
          },
          {
            title: 'Another Post',
            body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nec semper nulla, ac porta eros. 
                    Sed nunc tellus, bibendum non interdum nec, pellentesque nec risus. 
                    Nam ut orci sit amet leo lacinia rhoncus luctus ac augue. Nam sit amet venenatis sem. 
                    Aliquam mollis volutpat nulla et iaculis. Nulla facilisi. In hac habitasse platea dictumst.`,
            owner_id: 101,
          },
          {
            title: 'Yet Another Post',
            body: `Proin ex est, auctor sit amet libero nec, laoreet elementum odio. 
                    Donec nunc sem, egestas semper dolor varius, aliquam fermentum felis. Suspendisse 
                    volutpat nibh euismod, rhoncus metus non, feugiat tellus. Suspendisse congue est est, 
                    non auctor arcu egestas quis. Phasellus ornare egestas varius. Morbi bibendum ipsum nec enim 
                    venenatis volutpat. Cras enim massa, commodo nec auctor id, ultricies ut ante. `,
            owner_id: 101,
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
    return queryInterface.bulkDelete('post', null, {});
  },
};
