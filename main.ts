import { GoogleGenerativeAI } from "@google/generative-ai";
import { queryGoogleAnalyticsData, getQueryGoogleAnalyticsDataFunctionDeclaration } from './queryGoogleAnalyticsData';

import { config } from './config.js';

const API_KEY = 'API_KEY';
const PATH_TO_JSON_KEY = 'PATH_TO_JSON_KEY';
const PROJECT_ID = 'PROJECT_ID';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface Completion {
  Content: string;
  TokenUsage?: number;
}

interface ErrorCompletion {
  Error: string;
}

type ConnectorResponse = {
  Completions: Array<Completion | ErrorCompletion>;
  ModelType?: string;
};

type Function = (...args: any[]) => Promise<any>;

interface AvailableFunctions {
  [key: string]: Function;
}


const mapErrorToCompletion = (error: unknown): ErrorCompletion => {
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  return {
    Error: errorMessage,
  };
};


async function main(
  model: string,
  prompts: string[],
  properties: Record<string, unknown>,
  settings: Record<string, unknown>,
): Promise<ConnectorResponse> {
  try {
    const { ...restProperties } = properties;


    const genAI = new GoogleGenerativeAI(settings?.[API_KEY] as string);
    const pathToJsonKey = settings?.[PATH_TO_JSON_KEY] as string;
    const projectId = settings?.[PROJECT_ID] as string;
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      tools: [{
        functionDeclarations: [getQueryGoogleAnalyticsDataFunctionDeclaration],
      }],
      ...restProperties
    });

    const outputs: Array<Completion | ErrorCompletion> = [];
    let chatHistory: Message[] = [];
    let chat = geminiModel.startChat({
      history: chatHistory.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    for (const prompt of prompts) {
      try {
        chatHistory.push({ role: 'user', content: prompt });
        const result = await chat.sendMessage(prompt);
        const response = result.response;

        const functionCalls = result.response.functionCalls();
        console.log('Function calls:', functionCalls);
        const call = functionCalls ? functionCalls[0] : undefined;

        let text = '';

        if (call) {
          // Call the executable function named in the function call
          // with the arguments specified in the function call and
          // let it call the hypothetical API.
          const availableFunctions: AvailableFunctions = {
            queryGoogleAnalyticsData: queryGoogleAnalyticsData,
          };

          const functionToCall = availableFunctions[call.name];

          const functionResponse = await functionToCall(
            pathToJsonKey,
            projectId,
            ...Object.values(call.args),
          );

          const result2 = await chat.sendMessage([{
            functionResponse: {
              name: call.name,
              response: functionResponse[0]
            }
          }]);

          const response2 = result2.response;
          text = response2.text();
        } else {
          text = response.text();
        }

        // Count tokens
        const { totalTokens } = await geminiModel.countTokens(prompt);

        chatHistory.push({ role: 'model', content: text });
        outputs.push({ Content: text, TokenUsage: totalTokens });
      } catch (error) {
        const completionWithError = mapErrorToCompletion(error);
        outputs.push(completionWithError);
      }
    }

    return {
      Completions: outputs,
    };
  } catch (error) {
    console.error('Error in main function:', error);
    return {
      Completions: [mapErrorToCompletion(error)],
    };
  }
}

export { main, config };
