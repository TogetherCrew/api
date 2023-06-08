import * as neo4j from 'neo4j-driver';
import config from './config';
import { Query } from 'neo4j-driver-core/types/types';


const driver = neo4j.driver(config.neo4j.url, neo4j.auth.basic(config.neo4j.user, config.neo4j.password))

export async function read(cypher: Query, params = {}, database = config.neo4j.database){
    const session = driver.session({
        defaultAccessMode: neo4j.session.READ,
        database,
    })

    return session.run(cypher, params)
        .then(res => {
            session.close()
            return res
        })
        .catch(e => {
            session.close()
            throw e
        })
}

export async function write(cypher: Query, params = {}, database = config.neo4j.database){
    const session = driver.session({
        defaultAccessMode: neo4j.session.WRITE,
        database,
    })

    try {
        const res = await session.run(cypher, params);
        session.close();
        return res;
    } catch (e) {
        session.close();
        throw e;
    }
}
