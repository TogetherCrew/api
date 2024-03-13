# ServerComm
All communcation between frontend and DB

[![Maintainability](https://api.codeclimate.com/v1/badges/ad9db42ef0a42bb21764/maintainability)](https://codeclimate.com/github/TogetherCrew/api/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ad9db42ef0a42bb21764/test_coverage)](https://codeclimate.com/github/TogetherCrew/api/test_coverage)

## Installation

Clone the repository

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

## Neo4j Server

Below is a command for starting a Neo4j container in Docker
```bash
docker run \
        -d \
        --publish=7474:7474 --publish=7687:7687 \
        -e NEO4J_PLUGINS='["apoc", "graph-data-science"]' \
        -e NEO4J_apoc_export_file_enabled=true \
        -e NEO4J_apoc_import_file_enabled=true \
        -e NEO4J_apoc_import_file_use__neo4j__config=true \
        --name neo4j \
        neo4j
```

## License

[MIT](LICENSE)
