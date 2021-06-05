import AMMClass from '../src';
import gql from 'graphql-tag';
import SDLSyntaxException from '../src/sdlSyntaxException';
const AMM = new AMMClass({});

const makeExecutableSchema = params => {
  return AMM.makeExecutableSchema({
    ...params,
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
  });
};

test('Multiple model directives', () => {
  expect.assertions(1);
  try {
    makeExecutableSchema({
      typeDefs: gql`
        interface User @model
        type Admin implements User @model
      `,
    });
  } catch (err) {
    if (!(err instanceof SDLSyntaxException)) throw err;
    expect(err.code).toMatchInlineSnapshot(`"multipleModel"`);
  }
});

test('Multiple model directives in interfaces', () => {
  expect.assertions(1);
  try {
    makeExecutableSchema({
      typeDefs: gql`
        interface User @model
        interface Test @model
        type Admin implements User & Test
      `,
    });
  } catch (err) {
    if (!(err instanceof SDLSyntaxException)) throw err;
    expect(err.code).toMatchInlineSnapshot(`"multipleModel"`);
  }
});

test('Inherited from abstract should be model', () => {
  expect.assertions(1);
  try {
    makeExecutableSchema({
      typeDefs: gql`
        interface User @abstract
        type Admin implements User
      `,
    });
  } catch (err) {
    if (!(err instanceof SDLSyntaxException)) throw err;
    expect(err.code).toMatchInlineSnapshot(`"shouldBeModel"`);
  }
});

test('Inherited from abstract and model', () => {
  expect.assertions(1);
  try {
    makeExecutableSchema({
      typeDefs: gql`
        interface User @abstract
        interface Test @model
        type Admin implements User & Test @model
      `,
    });
  } catch (err) {
    if (!(err instanceof SDLSyntaxException)) throw err;
    expect(err.code).toMatchInlineSnapshot(`"abstractWithModel"`);
  }
});

test('Type of object field should be embedded, abstract  or model', () => {
  makeExecutableSchema({
    typeDefs: gql`
      interface Comment @model {
        title: String
      }
      type WallComment implements Comment
      type Post @model {
        comment: WallComment
      }
    `,
  });

  makeExecutableSchema({
    typeDefs: gql`
      type Comment
      type Post @model {
        comment: Comment
      }
    `,
  });
});
