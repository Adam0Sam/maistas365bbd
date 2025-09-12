import weaviate, { WeaviateClient } from "weaviate-ts-client";

export const client: WeaviateClient = weaviate.client({
  scheme: "https", // or "http" if local
  host: process.env.WEAVIATE_HOST!, // e.g. "localhost:8080" or "xyz.weaviate.network"
  apiKey: process.env.WEAVIATE_API_KEY
    ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
    : undefined,
});
