import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('abstract', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      likes: [User] @relation
      owner: User @relation
    }

    interface User @inherit @abstract {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User @model {
      username: String
    }

    type Subscriber implements User @model {
      profile: SubscriberProfile
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('PostUpdateInput', () => {
    expect(printType(schema.getType('PostUpdateInput'))).toMatchInlineSnapshot(`
                 "input PostUpdateInput {
                   title: String
                   likes: UserUpdateManyRelationInput
                   owner: UserUpdateOneRelationInput
                 }"
            `);
  });

  test('UserUpdateManyRelationInput', () => {
    expect(printType(schema.getType('UserUpdateManyRelationInput')))
      .toMatchInlineSnapshot(`
"input UserUpdateManyRelationInput {
  create: [UserInterfaceCreateInput]
  recreate: [UserInterfaceCreateInput]
  connect: [UserInterfaceWhereUniqueInput]
  connectOnce: [UserInterfaceWhereUniqueInput]
  reconnect: [UserInterfaceWhereUniqueInput]
  disconnect: [UserInterfaceWhereUniqueInput]
  delete: [UserInterfaceWhereUniqueInput]
}"
`);
  });

  test('UserCreateOneRelationInput', () => {
    expect(printType(schema.getType('UserCreateOneRelationInput')))
      .toMatchInlineSnapshot(`
                  "input UserCreateOneRelationInput {
                    create: UserInterfaceCreateInput
                    connect: UserInterfaceWhereUniqueInput
                  }"
            `);
  });

  test('UserCreateManyRelationInput', () => {
    expect(printType(schema.getType('UserCreateManyRelationInput')))
      .toMatchInlineSnapshot(`
                  "input UserCreateManyRelationInput {
                    create: [UserInterfaceCreateInput]
                    connect: [UserInterfaceWhereUniqueInput]
                  }"
            `);
  });

  test('UserInterfaceCreateInput', () => {
    expect(printType(schema.getType('UserInterfaceCreateInput')))
      .toMatchInlineSnapshot(`
            "input UserInterfaceCreateInput {
              Admin: AdminCreateInput
              Subscriber: SubscriberCreateInput
            }"
        `);
  });

  test('UserInterfaceWhereUniqueInput', () => {
    expect(printType(schema.getType('UserInterfaceWhereUniqueInput')))
      .toMatchInlineSnapshot(`
"input UserInterfaceWhereUniqueInput {
  aclWhere: UserWhereACLInput
  User: UserWhereUniqueInput
  Admin: AdminWhereUniqueInput
  Subscriber: SubscriberWhereUniqueInput
}"
`);
  });
});
