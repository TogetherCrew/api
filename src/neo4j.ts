import neo4j, { Driver } from 'neo4j-driver';
import config from './config';
import { Query } from 'neo4j-driver-core/types/types';
import parentLogger from './config/logger';

const logger = parentLogger.child({ module: 'Neo4j' });

let driver: Driver;
try {
  driver = neo4j.driver(config.neo4j.url, neo4j.auth.basic(config.neo4j.user, config.neo4j.password), {
    disableLosslessIntegers: true,
  });
  logger.info(
    `Connected to Neo4j!`,
  );
} catch (error) {
  logger.fatal(
    `Failed to connect to Neo4j!`,
  );
}

export async function read(cypher: Query, params = {}, database = config.neo4j.database) {
  const session = driver.session({
    defaultAccessMode: neo4j.session.READ,
    database,
  });

  return session
    .run(cypher, params)
    .then((res) => {
      session.close();
      return res;
    })
    .catch((e) => {
      logger.error({ cypher, params, e }, `Failed to run read operator!`);
      session.close();
      throw e;
    });
}

export async function write(cypher: Query, params = {}, database = config.neo4j.database) {
  const session = driver.session({
    defaultAccessMode: neo4j.session.WRITE,
    database,
  });

  try {
    const res = await session.run(cypher, params);
    session.close();
    return res;
  } catch (e) {
    logger.error({ cypher, params, e }, `Failed to run write operator!`);
    session.close();
    throw e;
  }
}
