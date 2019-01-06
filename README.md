# apollo-model-mongodb BETA
## Description
This package built on top of Apollo Server and allows you to automatically generate resolvers for MongoDB using Prisma-like SDL.

```graphql
type Category @model {
  id: ObjectID! @id @unique @db(name: "_id")
  title: String!
  tags: [String!]!
  items: [Item] @extRelation
}

type Item @model {
  id: ObjectID! @id @unique @db(name: "_id")
  title: String!
  color: String
  description: Description
  category: Category! @relation
  labels: [Label!]! @relation
  location: GeoJSONPoint
}

type Label @model {
  id: ObjectID! @id @unique @db(name: "_id")
  title: String!
}

type Description {
  full: String
  short: String
  location: GeoJSONPoint
  size: Size
}

type Size {
  width: Float
  height: Float
}
```
The above SDL compiles to this endpoint [https://apollo-model-mongodb-example.now.sh](https://apollo-model-mongodb-example.now.sh)
Example queries [below](#features)

We like Prisma but can't use it because it doesn't support some features we need. Like Geo Queries, custom scalars, DB queries middleware, easy customization.

## Installation
```
  npm install --save apollo-model-mongodb
```

## Usage
```javascript
  import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
  const schema = await new ApolloModelMongo({
    queryExecutor: QueryExecutor(db),
  }).makeExecutablSchema({
    typeDefs,
  });

  const server = new ApolloServer({
    schema,
  });
```
You can find full examples [here](examples)

## Serverless
You can use this package with serverless environments. Read more [here](https://www.apollographql.com/docs/apollo-server/servers/lambda.html). Also take a look at [example-now](examples/example-now) if you are using Zeit Now.

## Customization
* You can define your own scalars and directives as for usual Apollo server.
* You can add custom modules at MongoModel stage (description coming soon)
* All queries to DB executes with QueryExecutor function. This package has predefined one, but you can override it and add hooks or check user authorization.
```
const QueryExecutor = ({ type, collection, doc, selector, options })=>Promise
```

## Contribution
You are welcome to open PR with new features and bug fixes

## Roadmap
* Add createdAt, updatedAt directives
* Add subscriptions
* Release stable version 1.0.0
* Add Moment scalar
* Improve Geo queries support

## Features
* [Simple query](#simple-query)
* [Simple create](#simple-create)
* [Filter](#filter)
* [Difficult filter](#difficult-filter)
* [Simple create](#simple-create)
* [Relation query](#relation-query)
* [Relation filter](#relation-filter)
* [Cascade create](#cascade-create)
* [Geo queries](#geo-queries)

### Simple query

##### query
```graphql
query{
  items
  {
    id
    title
  }
}
```
##### response
```json
{
  "data": {
    "items": [
      {
        "id": "5c0b7d543aaf685be99bcb13",
        "title": "apple"
      },
      {
        "id": "5c0b7dfb3aaf685be99bcb15",
        "title": "tomato"
      }
    ]
  }
}
```

### Simple create
##### query
```graphql
mutation{
	createLabel(
    data:{
    	title:"New label"
    }
  ){
    id
  }
}
```
##### response
```json
{
  "data": {
    "createLabel": {
      "id": "5c3242ea1dd49857441435ac"
    }
  }
}
```

### Filter 
##### request
```graphql
query{
  items(where:{title_starts_with:"app"})
  {
    title
  }
}
```
#### response
```graphql
{
  "data": {
    "items": [
      {
        "title": "apple"
      }
    ]
  }
}
```

### Difficult filter 
##### request
```graphql
query{
  items(where:{
    OR:[
      {category:{title:"fruits"}},
      {description:{size:{width_gt:10}}}
    ]
  })
  {
    title
    description{
      size{
				width
      }
    }
  }
}
```
#### response
```graphql
{
  "data": {
    "items": [
      {
        "title": "apple",
        "description": null
      },
      {
        "title": "tomato",
        "description": {
          "size": {
            "width": 100
          }
        }
      }
    ]
  }
}
```


### Relation query
##### query
```graphql
query{
  items
  {
    title
    category{
      id
      title
    }
	}
}
```
##### response
```json
{
  "data": {
    "items": [
      {
        "title": "apple",
        "category": {
          "id": "5c0acb20b570c059a050597a",
          "title": "fruits"
        }
      },
      {
        "title": "tomato",
        "category": {
          "id": "5c30e76a9ce4a233cb4fc5dc",
          "title": "berries"
        }
      }
    ]
  }
}
```

### Relation filter
##### query
```graphql
query{
  items(where:{category:{title:"fruits"}})
  {
    title
  }
}
```
##### response
```json
{
  "data": {
    "items": [
      {
        "title": "apple"
      }
    ]
  }
}
```

### Cascade create
##### query
```graphql
mutation{
  createItem(data:{
    title:"new item",
    category:{
	  create:{
        title:"new category"
        tags:[]
      }
    }
  }){
    id
    title
    category{
      id
      title
    }
  }
}
```
##### response
```json
{
  "data": {
    "createItem": {
      "id": "5c324d0d05c95f5ad95bde3d",
      "title": "new item",
      "category": {
        "id": "5c324d0d05c95f5ad95bde3c",
        "title": "new category"
      }
    }
  }
}
```


### Geo queries
##### query
```graphql
query{
  items(where:{
    location_near:{
      geometry:{
        type:Point,
        coordinates:[0.0001,0.0001]
      }
      minDistance:0,
      maxDistance:100
    }
  })
  {
    title
    location{
      coordinates
      distance(toPoint:{
        type:Point
        coordinates:[0.0001,0.0001]
      })
    }
  }
}
```
##### response
```json
{
  "data": {
    "items": [
      {
        "title": "tomato",
        "location": {
          "coordinates": [
            0,
            0
          ],
          "distance": 15.725337332777647
        }
      }
    ]
  }
}
```

