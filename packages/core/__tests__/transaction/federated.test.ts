import gql from 'graphql-tag';
import { buildFederatedSchema } from './buildFederatedSchema';
import { prepareTransaction } from '../utils/prepareTransaction';

describe('federated', () => {
  const schema = buildFederatedSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation
      likes: [User] @relation
    }

    interface User @abstract @inherit {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User @model {
      username: String
    }

    type Subscriber implements User @model {
      profile: SubscriberProfile
    }

    type SubscriberProfile {
      name: String
    }
  `);

  test('entities', () => {
    const rq = gql`
      query {
        _entities(representations: [{ __typename: "Post", id: "post-id" }]) {
          __typename
        }
      }
    `;

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": undefined,
            "identifier": "Operation-0",
            "kind": "AMReadEntitiesOperation",
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "representations": Array [
              Object {
                "collectionName": "posts",
                "selector": Object {
                  "_id": "post-id",
                },
                "typename": "Post",
              },
            ],
          },
        ],
      }
    `);
  });
});
