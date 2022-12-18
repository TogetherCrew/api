import config from "../config";

const swaggerDef = {
    openapi: "3.0.0",
    info: {
        title: "RnDAO documentation",
        version: "0.0.1",
        servers: [
            { url: `localhost${config.port}/api/v1` },
            // { url: `localhost${config.port}/api/v1` },
        ],
    },
};

export default swaggerDef;
