import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';

export const createGateway = () => {
  const gateway = new ApolloGateway({
    serviceList: [
      { name: 'serviceA', url: 'http://localhost:4001' },
      { name: 'serviceB', url: 'http://localhost:4002' },
      // Define additional services here
    ],
  });

  // Pass the ApolloGateway to the ApolloServer constructor
  const server = new ApolloServer({
    gateway,
    subscriptions: false,
  });
  return server;
};
