# Apollo Model

## Running DB Migrations
Build the migrations image
```
docker-compose build migrations
```

Start the Postrges
```
docker-compose up postgres
```

Run migrations
```
docker-compose run migrations
```