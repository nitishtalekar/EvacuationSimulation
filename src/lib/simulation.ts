import { llmResponder } from "@/utils/llm_responder";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey:
    process.env.GOOGLE_API_KEY ??
    (() => {
      throw new Error("GOOGLE_API_KEY is not set.");
    })(),
});

export async function runSimulation(variables: any): Promise<ReadableStream> {
  const { characters, evacmsg, systemPrompt, evaluationPrompt } = variables;

  const results: any[] = [];

  for (const char of characters) {
    const charResponse = await llmResponder(llm, systemPrompt, {
      ...char,
      evacmsg,
    });

    const evalResponse = await llmResponder(llm, evaluationPrompt, {
      response: charResponse,
      evacmsg,
    });

    results.push({
      character: char,
      response: charResponse,
      evaluation: evalResponse,
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(JSON.stringify({ results }));
      controller.close();
    },
  });

  return stream;
}

