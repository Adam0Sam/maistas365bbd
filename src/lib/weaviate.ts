import weaviate, { WeaviateClient } from "weaviate-ts-client";
import { WEAVIATE_API_KEY, WEAVIATE_URL } from '../config/enviroment';

export const weaviateClient: WeaviateClient = weaviate.client({
  scheme: "https",
  host: WEAVIATE_URL!, 
  apiKey: WEAVIATE_API_KEY
    ? new weaviate.ApiKey(WEAVIATE_API_KEY)
    : undefined,
});
