// Develop & build using netlify-lambda
const algoliasearch = require('algoliasearch');
const fs = require('fs');

const algoliaApp = '050Q9I7JU4';
const algoliaIndex = 'joost.meijles.com';

exports.handler = function(event, context, callback) {
    const client = algoliasearch(algoliaApp, process.env.ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(algoliaIndex);

    const rawdata = fs.readFileSync(`${URL}/algolia.json`);  
    const json = JSON.parse(rawdata);
    
    index.addObjects(json, function(err, content) {
        if (err) {
            callback(null, {
                statusCode: 500,
                body: err
            });
        }
        else {
            callback(null, {
                statusCode: 200,
                body: `Completed task: ${content.taskID}`
            });
        }
    });
}
