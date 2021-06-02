import { ObjectId } from 'mongodb';
import { getDb } from './connection';

export const runSeed = async () => {
  const db = await getDb();
  const collections = await db.collections();

  if (collections.length === 0) {
    await db.collection('users').insertMany([
      {
        _id: new ObjectId('60b7d41d1c78717719b5527b'),
        _type: 'admin',
        created_at: new Date('2021-06-02T18:55:25.149Z'),
        updatedAt: new Date('2021-06-02T18:55:25.149Z'),
        username: 'admin',
        access: 'owner',
      },
      {
        _id: new ObjectId('60b7d4ae1c78717719b5527c'),
        _type: 'subscriber',
        created_at: new Date('2021-06-02T18:57:50.193Z'),
        updatedAt: new Date('2021-06-02T18:57:50.193Z'),
        username: 'GregRa',
        plan: 'standard',
        profile: {
          firstName: 'Greg',
          lastName: 'R',
        },
      },
      {
        _id: new ObjectId('60b7d4e01c78717719b5527d'),
        _type: 'subscriber',
        created_at: new Date('2021-06-02T18:58:40.082Z'),
        updatedAt: new Date('2021-06-02T18:58:40.082Z'),
        username: 'antt001',
        plan: 'free',
        profile: {
          firstName: 'Anatoly',
          lastName: 'T',
        },
      },
      {
        _id: new ObjectId('60b7d4f91c78717719b5527e'),
        _type: 'subscriber',
        created_at: new Date('2021-06-02T18:59:05.342Z'),
        updatedAt: new Date('2021-06-02T18:59:05.342Z'),
        username: 'elazar',
        plan: 'premium',
        profile: {
          firstName: 'Elazar',
          lastName: 'K',
        },
      },
      {
        _id: new ObjectId('60b7d5051c78717719b5527f'),
        _type: 'subscriber',
        created_at: new Date('2021-06-02T18:59:17.314Z'),
        updatedAt: new Date('2021-06-02T18:59:17.314Z'),
        username: 'vitramir',
        plan: 'free',
        profile: {
          firstName: 'Vitalii',
          lastName: 'V',
        },
      },
    ]);

    await db.collection('categories').insertMany([
      {
        _id: new ObjectId('60b7d6ce42ebe87a65944a7c'),
        created_at: new Date('2021-06-02T19:06:54.664Z'),
        updatedAt: new Date('2021-06-02T19:06:54.664Z'),
        title: 'Cars',
        parentCategoryId: new ObjectId('60b7d6ce42ebe87a65944a7e'),
      },
      {
        _id: new ObjectId('60b7d6ce42ebe87a65944a7d'),
        created_at: new Date('2021-06-02T19:06:54.664Z'),
        updatedAt: new Date('2021-06-02T19:06:54.664Z'),
        title: 'Houses',
        parentCategoryId: new ObjectId('60b7d6ce42ebe87a65944a7e'),
      },
      {
        _id: new ObjectId('60b7d6ce42ebe87a65944a7e'),
        created_at: new Date('2021-06-02T19:06:54.664Z'),
        updatedAt: new Date('2021-06-02T19:06:54.664Z'),
        title: 'root',
      },
    ]);

    await db.collection('posts').insertMany([
      {
        _id: new ObjectId('60b7db4632793b7d782999b9'),
        created_at: new Date('2021-06-02T19:25:58.273Z'),
        updatedAt: new Date('2021-06-02T19:25:58.273Z'),
        title: 'Sell a house',
        body: '',
        categoryId: new ObjectId('60b7d6ce42ebe87a65944a7d'),
        keywords: ['townhouse'],
        userId: new ObjectId('60b7d4ae1c78717719b5527c'),
      },
      {
        _id: new ObjectId('60b7dbac32793b7d782999ba'),
        created_at: new Date('2021-06-02T19:27:40.441Z'),
        updatedAt: new Date('2021-06-02T19:27:40.441Z'),
        title: 'Buy a car',
        body: '',
        categoryId: new ObjectId('60b7d6ce42ebe87a65944a7c'),
        keywords: ['sportcar'],
        userId: new ObjectId('60b7d4e01c78717719b5527d'),
      },
    ]);
  }
};
