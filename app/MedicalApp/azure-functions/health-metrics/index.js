const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');

module.exports = async function (context, req) {
    try {
        // Validate request
        if (!req.body) {
            context.res = {
                status: 400,
                body: "Please pass a request body"
            };
            return;
        }

        // Get configuration from environment variables
        const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
        const cosmosKey = process.env.COSMOS_KEY;
        const databaseId = process.env.COSMOS_DATABASE_ID;
        const containerId = process.env.COSMOS_CONTAINER_ID;
        const digitalTwinEndpoint = process.env.DIGITAL_TWIN_ENDPOINT;
        const digitalTwinId = process.env.DIGITAL_TWIN_ID;

        // Initialize Cosmos DB client
        const cosmosClient = new CosmosClient({
            endpoint: cosmosEndpoint,
            key: cosmosKey
        });

        // Initialize Digital Twins client
        const credential = new DefaultAzureCredential();
        const dtClient = new DigitalTwinsClient(digitalTwinEndpoint, credential);

        // Get container reference
        const container = cosmosClient.database(databaseId).container(containerId);

        // Prepare health metrics data
        const healthMetrics = {
            ...req.body,
            timestamp: new Date().toISOString()
        };

        // Store in Cosmos DB
        const { resource: createdItem } = await container.items.create(healthMetrics);

        // Update Digital Twin
        // Remove Cosmos DB specific fields
        const twinData = { ...healthMetrics };
        delete twinData.id;
        delete twinData._rid;
        delete twinData._self;
        delete twinData._etag;
        delete twinData._attachments;
        delete twinData._ts;

        await dtClient.updateDigitalTwin(digitalTwinId, twinData);

        // Return success response
        context.res = {
            status: 200,
            body: {
                message: "Health metrics processed successfully",
                id: createdItem.id
            }
        };

    } catch (error) {
        context.log.error('Error processing health metrics:', error);
        context.res = {
            status: 500,
            body: {
                error: "Error processing health metrics",
                details: error.message
            }
        };
    }
}; 