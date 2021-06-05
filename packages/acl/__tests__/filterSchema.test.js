import AMM from '@graphex/core';
import { printSchema } from 'graphql';
import gql from 'graphql-tag';
import R from 'ramda';
import { removeUnusedTypes } from '@graphex/schema-filter';
import {
  allMutations,
  allQueries,
  anyField,
  applyRules,
  modelCustomActions,
  modelDefaultActions,
  modelField,
} from '../src';

const createSchema = (typeDefs) => {
  const schema = new AMM({
    queryExecutor: null,
  }).makeExecutableSchema({
    typeDefs,
  });
  return schema;
};

describe('accessRules', () => {
  jest.setTimeout(30000);

  it('wildcard filter', () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ID @id @unique
        title: String
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
    });
    expect(printSchema(aclSchema)).toEqual(
      printSchema(removeUnusedTypes(schema))
    );
  });

  it('CRU only', () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ID! @id @unique
        title: String
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [modelDefaultActions('Post', 'CRU'), anyField],
    });

    const referenceSchema = removeUnusedTypes(R.clone(schema));
    delete referenceSchema.getTypeMap().Mutation._fields.deletePost;
    delete referenceSchema.getTypeMap().Mutation._fields.deletePosts;

    expect(printSchema(aclSchema)).toEqual(printSchema(referenceSchema));
  });

  it('R only', () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ID! @id @unique
        title: String
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [modelDefaultActions('Post', 'R'), anyField],
    });

    const referenceSchema = removeUnusedTypes(R.clone(schema));
    delete referenceSchema._typeMap.Mutation;
    delete referenceSchema._typeMap.PostCreateInput;
    delete referenceSchema._typeMap.PostUpdateInput;

    expect(printSchema(aclSchema)).toEqual(printSchema(referenceSchema));
  });

  it('Custom actions', () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ID! @id @unique
        title: String
      }

      extend type Mutation {
        approvePost(id: ID): Post
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelCustomActions('Post', ['approve'])],
    });

    const referenceSchema = removeUnusedTypes(R.clone(schema));
    delete referenceSchema.getTypeMap().Mutation._fields.approvePost;

    expect(printSchema(aclSchema)).toEqual(printSchema(referenceSchema));
  });

  it('Interface model', () => {
    const schema = createSchema(gql`
      interface User @inherit @model {
        id: ID! @id @unique
      }

      type Admin implements User {
        username: String
      }

      type Customer implements User {
        name: String
        surname: String
        phone: String
      }

      type Supplier implements User {
        legalEntity: String
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [modelDefaultActions('User', 'CRUD'), anyField],
      deny: [modelDefaultActions('Admin', 'CUD')],
    });

    const referenceSchema = removeUnusedTypes(R.clone(schema));
    const { Mutation, Query } = referenceSchema.getTypeMap();
    delete Mutation._fields.deleteAdmin;
    delete Mutation._fields.deleteAdmins;
    delete Mutation._fields.updateAdmin;
    delete Mutation._fields.createAdmin;
    delete referenceSchema._typeMap.AdminUpdateInput;

    expect(printSchema(aclSchema)).toEqual(printSchema(referenceSchema));
  });

  it('Remove all fields from type', () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ID @id @unique
        meta: PostMeta
      }

      type PostMeta {
        keywords: [String]
      }
    `);

    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelField('PostMeta', 'keywords', 'CRUD')],
    });

    //we should remove meta field from Post because Meta's fields doesn't match allow rules
    expect(Object.keys(aclSchema.getTypeMap().Post.getFields())).toEqual([
      'id',
    ]);
  });
});
