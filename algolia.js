// Develop & build using netlify-lambda
import algoliasearch from 'algoliasearch';
import fetch from 'node-fetch';

const algoliaApp = '050Q9I7JU4';
const algoliaIndex = 'joost.meijles.com';

exports.handler = async (event, context, callback) => {
    // Fetch data
    const url = `${process.env.URL}/algolia.json`;
    const response = await fetch(url);
    const data = await response.json();

    // Init Algolia
    const client = algoliasearch(algoliaApp, process.env.ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(algoliaIndex);

    // Add documents to Algolia
    const res = await index.addObjects(data);

    return {
        statusCode: 200,
        body: `Completed task ${res.taskID}`
    };
}
