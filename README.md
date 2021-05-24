# Apollo Model

## Running DB Migrations
Build the migrations image
```
docker-compose build migrations
```

Start the Postrges
```
docker-compose up -d postgres
```

Run migrations
```
docker-compose run migrations yarn db:migrate
```

Run seeds
```
docker-compose run migrations yarn db:seed:all
```