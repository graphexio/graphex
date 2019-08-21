import fetch from 'node-fetch';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';

var proxy = require('express-http-proxy');
var app = require('express')();

const ammServer = 'http://localhost:4000'; /* example-server */
const defaultServer =
  'http://localhost:4002'; /* example-gateway/default-server */
const authorizedServer = 'http://localhost:4001'; /* acl/dev-server */

const AMMLink = new HttpLink({ uri: ammServer, fetch });

const roles = {
  default: proxy(defaultServer),
  admin: proxy(authorizedServer),
};

const selectProxy = async (req, res, next) => {
  let { token } = req.headers;

  //Do not store token in DB as is in production
  const operation = {
    query: gql`
      query getSession($token: ID) {
        sessions(where: { token: $token }) {
          user {
            ... on Node {
              id
              __typename
            }
          }
        }
      }
    `,
    variables: { token },
  };

  const { data } = await makePromise(execute(AMMLink, operation));
  const { sessions } = data;
  let role = 'default';
  if (sessions.length > 0) {
    let session = sessions[0];
    if (session.user.__typename == 'Admin') role = 'admin';
  }

  roles[role](req, res, next);
};

app.use('/', selectProxy);

app.listen(3000);
