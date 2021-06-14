
# Graphex

Graphex is an open source no-code framework to build and deploy GraphQL backends quickly without much effort from the engineering teams. You can create your GraphQL models and get a fully functional GraphQL server that supports "CRUD" like operations against your data source. 

## Features
- CRUD like operations on GraphQL types
- Automatic Filters for Queries
- Relations between types with OOTB operations
- Work with sub-documents (MongoDB only)
- Support GraphQL Federation and external relations

See full [feature set](https://gitlab.com/graphexio/graphex/-/blob/feature/features-list/features.md)

## Quick Start
[![Edit graphex-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/graphexio/graphex/tree/master/packages/example-server)


## Data Sources
Out of the box Graphex supports working with MongoDB, but is easily extendable to other data sources through adapters. 


## Packages within this Monorepo
- `@graphex/core` - The engine that generates the graphex server. See [here](packages/core/README.md) for more details
- `@graphex/acl` - Adds access control to types, fields and filters

## Licence
Graphex © 2021, Released under the [ISC Open Source Initiative License](https://opensource.org/licenses/ISC)