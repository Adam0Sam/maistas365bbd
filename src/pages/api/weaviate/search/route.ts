import { weaviateClient } from "@/lib/weaviate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
   const { query, fields, limit = 10 } = await req.json();

   if (!query || !fields) {
      return NextResponse.json(
         { error: "You must provide both 'query' and 'fields'" },
         { status: 400 }
      );
   }

   const safeFields = Array.isArray(fields)
      ? [...fields, "productId"].join(" ")
      : "productId name price";

   let res;

   res = await weaviateClient.graphql
      .get()
      .withClassName("Products")
      .withFields(safeFields)
      .withNearText({ concepts: [query] })
      .withLimit(limit)
      .do();

   return NextResponse.json(res.data.Get.Products ?? []);
}
