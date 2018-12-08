# apollo-model-mongodb BETA
## Description
This package built on top of Apollo Server and allows you to automatically generate resolvers for MongoDB using Prisma-like SDL.

```graphql
  type Description {
    full: String
    short: String
  }

  type Category @model {
    id: ObjectID! @unique @renameDB(name: "_id")
    title: String!
    items: [Item] @relation(externalField: "categoryId")
  }

  type Item @model {
    id: ObjectID! @unique @renameDB(name: "_id")
    title: String!
    color: String
    description: Description
    category: Category! @relation
  }
```
The above SDL compiles to this endpoint [https://apollo-model-mongodb-example.now.sh](https://apollo-model-mongodb-example.now.sh)

We like Prisma but can't use it because it doesn't support some features we need. Like Geo Queries, custom scalars, DB queries middleware, easy customization.

## Installation
```
  npm install --save apollo-model-mongodb
```

## Usage
```javascript
  import makeExecutablSchema, { QueryExecutor } from 'apollo-model-mongodb';
  const schema = makeExecutablSchema(
    {
      typeDefs,
    },
    { queryExecutor: QueryExecutor(db) }
  );

  const server = new ApolloServer({
    schema,
  });
```
You can find full examples [here](examples)

## Serverless
You can use this package with serverless environments. Read more [here](https://www.apollographql.com/docs/apollo-server/servers/lambda.html). Also take a look at [example-now](examples/example-now) if you are using Zeit Now.

## Customization
All queries to DB executes with QueryExecutor function. This package has predefined one, but you can override it and add hooks or check user authorization.
```
const QueryExecutor = ({ type, collection, doc, selector, options })=>Promise
```

## Roadmap (until the end of 2018)
* Add cascade insert (Allows to insert records in multiple collections within one mutation)
* Improve Geo Queries Support
* Rename directives to match Prisma
* Add Moment scalar (with support of some arguments format, add, timezone)
* Add subscriptions

## Contribution
You are welcome to open PR with new features and bug fixes
