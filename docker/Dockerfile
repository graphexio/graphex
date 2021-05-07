FROM node:14.16.1

WORKDIR /workspace/

COPY package.json yarn.lock /workspace/

# install
RUN  yarn install --frozen-lockfile

COPY ./database /workspace/database

CMD ["sh", "./docker/entrypoint.sh"]
