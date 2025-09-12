import weaviate, { WeaviateClient } from "weaviate-ts-client";

export const weaviateClient: WeaviateClient = weaviate.client({
   scheme: "https",
   host: process.env.WEAVIATE_URL!,
   apiKey: process.env.WEAVIATE_API_KEY
      ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
      : undefined,
   headers: {
      // REQUIRED for text2vec-openai
      "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY!,
   },
});
