import { printType } from 'graphql';
import gql from 'graphql-tag';
import Core from '../../src';

describe('outside relation', () => {
  const schema = new Core().makeExecutableSchema({
    typeDefs: gql`
      type Item {
        id: ID @unique
      }

      type Collection @model {
        id: ID @id @unique
        title: String
        items: [Item] @relationOutside
        item: Item @relationOutside
      }
    `,
  });

  test('Target model WhereUniqueInput', () => {
    expect(printType(schema.getType('ItemWhereUniqueInput')))
      .toMatchInlineSnapshot(`
        "input ItemWhereUniqueInput {
          id: ID
        }"
      `);
  });

  describe('create', () => {
    test('Source model `create input`', () => {
      expect(printType(schema.getType('CollectionCreateInput')))
        .toMatchInlineSnapshot(`
        "input CollectionCreateInput {
          title: String
          items: ItemCreateManyRelationOutsideInput
          item: ItemCreateOneRelationOutsideInput
        }"
      `);
    });

    test('Target model `create many relation` input', () => {
      expect(printType(schema.getType('ItemCreateManyRelationOutsideInput')))
        .toMatchInlineSnapshot(`
          "input ItemCreateManyRelationOutsideInput {
            connect: [ItemWhereUniqueInput]
          }"
        `);
    });

    test('Target model `create one relation` input', () => {
      expect(printType(schema.getType('ItemCreateOneRelationOutsideInput')))
        .toMatchInlineSnapshot(`
          "input ItemCreateOneRelationOutsideInput {
            connect: ItemWhereUniqueInput
          }"
        `);
    });
  });

  describe('update', () => {
    test('Source model `update` input', () => {
      expect(printType(schema.getType('CollectionUpdateInput')))
        .toMatchInlineSnapshot(`
        "input CollectionUpdateInput {
          title: String
          items: ItemUpdateManyRelationOutsideInput
          item: ItemUpdateOneRelationOutsideInput
        }"
      `);
    });

    test('Target model `update many relation` input', () => {
      expect(printType(schema.getType('ItemUpdateManyRelationOutsideInput')))
        .toMatchInlineSnapshot(`
          "input ItemUpdateManyRelationOutsideInput {
            connect: [ItemWhereUniqueInput]
            reconnect: [ItemWhereUniqueInput]
            disconnect: [ItemWhereUniqueInput]
          }"
        `);
    });

    test('Target model `update one relation` input', () => {
      expect(printType(schema.getType('ItemUpdateOneRelationOutsideInput')))
        .toMatchInlineSnapshot(`
          "input ItemUpdateOneRelationOutsideInput {
            connect: ItemWhereUniqueInput
          }"
        `);
    });
  });
});
