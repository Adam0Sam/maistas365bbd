import { NextResponse } from "next/server";
import { client } from "@/lib/weaviate";

export async function POST(req: Request) {
   const { query } = await req.json();

   const result = await client.graphql
      .get()
      .withClassName("Article") // your collection name
      .withFields("title content")
      .withNearText({ concepts: [query] })
      .withLimit(5)
      .do();

   return NextResponse.json(result.data.Get.Article);
}
