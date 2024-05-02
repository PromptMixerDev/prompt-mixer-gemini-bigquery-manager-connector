import { BigQuery } from '@google-cloud/bigquery';
import { FunctionDeclaration, FunctionDeclarationSchemaType } from '@google/generative-ai';


// Function to query Google Analytics data from Google BigQuery
async function queryGoogleAnalyticsData(keyFilename: string, projectId: string, query: string): Promise<any[]> {
  const bigquery = new BigQuery({
    // Path to your Google Cloud Credentials
    keyFilename: keyFilename,
    projectId: projectId, // Your Google Cloud Project ID
  });

  try {
    console.log('Executing BigQuery SQL:', query);
    const [job] = await bigquery.createQueryJob({query: query});
    console.log(`Job ${job.id} started.`);
    const [rows] = await job.getQueryResults();
    console.log('Query results received.');

    // Assuming the query results fit the Customer interface
    return rows as any[];
  } catch (error) {
    console.error('Error querying Google Analytics data from BigQuery:', error);
    throw error;
  }
}

// Function declaration for queryGoogleAnalyticsData
const getQueryGoogleAnalyticsDataFunctionDeclaration: FunctionDeclaration = {
    name: "queryGoogleAnalyticsData",
    description: "This function queries Google Analytics data from Google BigQuery. It is designed to handle complex queries for analytics data retrieval. Users must ensure they have appropriate credentials and permissions configured to avoid unauthorized access and potential security risks.",
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      description: "Parameters for the queryGoogleAnalyticsData function",
      properties: {
        query: {
          type: FunctionDeclarationSchemaType.STRING,
          description: 'The SQL query string to execute in BigQuery for retrieving Google Analytics data.',
        },
      },
      required: ["query"],
    },
  };

export { queryGoogleAnalyticsData, getQueryGoogleAnalyticsDataFunctionDeclaration };