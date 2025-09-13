import { ApifyClient } from 'apify-client';
import type { NextApiRequest, NextApiResponse } from 'next';

const client = new ApifyClient({
    token: process.env.SCRAPER_API_KEY,
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const input = {
            start_urls: [url]
        };

        const run = await client.actor("XnXUJ6xuoxwLUNKPV").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return res.status(404).json({ error: 'No recipe found' });
        }

      

        res.status(200).json(items);

    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Import failed' });
    }
}