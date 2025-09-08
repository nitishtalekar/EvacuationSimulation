export async function llmResponder(
  llm: any,
  prompt: string,
  variables: any = {}
): Promise<string> {
  console.log(
    `[llmResponder] Generating Response`
  );
  const llmPrompt = prompt.replace(/{(\w+)}/g, (_, varName) => {
    return variables[varName] ? variables[varName] : `{${varName}}`;
  });

  const res = await llm.invoke(llmPrompt);

  console.log(`[llmResponder] Response: ${res.content}`);

  return res.content;
}

// Extract the number from the response
//   const match = res.content.trim().match(/-?1(?:\.0+)?|-?0(?:\.\d+)?/);
//   if (!match) throw new Error(`Unexpected model output: "${res.content}"`);