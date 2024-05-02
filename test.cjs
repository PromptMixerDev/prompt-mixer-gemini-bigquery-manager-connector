// Import the Google Cloud client library using default credentials
const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery({
    // Path to your Google Cloud Credentials
    keyFilename: '/Users/tomatyss/Downloads/promptmixer-5c514783e9dc.json',
    projectId: 'promptmixer', // Your Google Cloud Project ID
  });
async function query() {
  // Queries the U.S. given names dataset for the state of Texas.

  const query = 'SELECT * FROM `promptmixer.INFORMATION_SCHEMA.TABLES`';

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
  };
  console.log(options); 
  // Run the query as a job
  const [job] = await bigquery.createQueryJob({query});
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  console.log('Rows:');
  rows.forEach(row => console.log(row));
}

query();