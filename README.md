# ServerComm
All communcation between front-end and DB

## CI/CD

### Linter

The CI Pipeline uses [super-linter](https://github.com/super-linter/super-linter). You can run it locally with the following command:

```bash
docker run -e RUN_LOCAL=true -e TYPESCRIPT_DEFAULT_STYLE=prettier -e VALIDATE_DOCKERFILE_HADOLINT=false -v $(pwd):/tmp/lint github/super-linter:slim-latest
```

Note: We have disabled HADOLINT for now as we are getting an error: `qemu: uncaught target signal 11 (Segmentation fault) - core dumped`.

### Tests

The CI Pipeline uses the `test` target from the Dockerfile to run the tests. You can run it locally with the following command:

```bash
docker compose -f docker-compose.test.yml up --exit-code-from app --build
```

Note: This will create a /coverage folder where you can review the coverage details.

### Development Environment

You can run all the integration services using the following command:

```bash
docker compose -f docker-compose.dev.yml up
```

#### Supported Services

- MongoDB ([mongoose](https://mongoosejs.com/))
- Redis ([BullMQ](https://bullmq.io/) and [bull-board](https://github.com/felixmosh/bull-board))
- RabbitMQ ([RabbitMQ](https://www.rabbitmq.com/) and [RabbitMQ Management](https://www.rabbitmq.com/managment))

#### Local Resources

- [Bull Board](http://localhost:3000/admin/queues) - *Needs to be implemented*
- [RabbitMQ Management](http://localhost:15672)

## Installation

Clone the repo

Install the dependencies:

```bash
npm install
```


Set the environment variables(see src/config/index to know what environment variables this app need):

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```

Run application:
```bash
npm run dev
```

Run tests:
```bash
npm run test
```

## License

[MIT](LICENSE)