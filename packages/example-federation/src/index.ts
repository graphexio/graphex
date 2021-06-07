import { server as serverA } from './serviceA';
import { server as serverB } from './serviceB';
import { createGateway } from './gateway';

(async () => {
  await serverA.listen({ port: 4001 }).then(({ url }) => {
    console.log(`🚀  ServerA ready at ${url}`);
  });

  await serverB.listen({ port: 4002 }).then(({ url }) => {
    console.log(`🚀  ServerB ready at ${url}`);
  });

  await createGateway()
    .listen({ port: 4000 })
    .then(({ url }) => {
      console.log(`🚀  Gateway ready at ${url}`);
    });
})();
