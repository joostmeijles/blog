// Develop & build using netlify-lambda
const algoliasearch = require('algoliasearch');
const axios = require('axios');

const algoliaApp = '050Q9I7JU4';
const algoliaIndex = 'joost.meijles.com';

exports.handler = function(event, context, callback) {
    const client = algoliasearch(algoliaApp, process.env.ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(algoliaIndex);

    axios.get(`${process.env.URL}/algolia.json`)
        .then(res => res.json())
        .then(json => {
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
            })
        });
}
