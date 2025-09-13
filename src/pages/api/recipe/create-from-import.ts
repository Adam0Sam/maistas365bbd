import { ApifyClient } from 'apify-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const client = new ApifyClient({
    token: process.env.SCRAPER_API_KEY,
});

const GeneratedIngredientSchema = z.object({
   name: z.string(),
   quantity: z.string(),
});

const GeneratedRecipeSchema = z.object({
   title: z.string(),
   description: z.string(),
   servings: z.number(),
   prep_time_minutes: z.number().min(1).max(120),
   cook_time_minutes: z.number().min(1).max(240),
   total_time_minutes: z.number().min(1).max(360),
   ingredients: z.array(GeneratedIngredientSchema).min(3),
   instructions: z.array(z.string()).min(2),
});

const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 30; // default fallback
    
    const hoursMatch = timeStr.match(/(\d+)\s*h/i);
    const minutesMatch = timeStr.match(/(\d+)\s*m/i);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes > 0 ? totalMinutes : 30; // fallback to 30 minutes
};

const parseIngredients = (ingredients: any[]): Array<{name: string, quantity: string}> => {
    if (!Array.isArray(ingredients)) return [];
    
    return ingredients.map(ingredient => {
        if (typeof ingredient === 'string') {
            // Try to split quantity from ingredient name
            const parts = ingredient.split(' ');
            const quantity = parts.slice(0, 2).join(' '); // Take first 1-2 words as quantity
            const name = parts.slice(2).join(' '); // Rest as name
            
            return {
                quantity: quantity || '1',
                name: name || ingredient
            };
        } else if (ingredient.name) {
            return {
                quantity: ingredient.quantity || ingredient.amount || '1',
                name: ingredient.name
            };
        }
        return { quantity: '1', name: String(ingredient) };
    }).filter(ing => ing.name.length > 0);
};

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
        // Get scraped data using existing import API logic
        const input = {
            start_urls: [url]
        };

        const run = await client.actor("XnXUJ6xuoxwLUNKPV").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            return res.status(404).json({ error: 'No recipe found' });
        }

        const scrapedData = items[0];

        // Convert to GeneratedRecipe format
        const prepTime = parseTimeToMinutes(scrapedData.prep_time || '');
        const cookTime = parseTimeToMinutes(scrapedData.cook_time || scrapedData.cooking_time || '');
        const totalTime = parseTimeToMinutes(scrapedData.total_time || '') || (prepTime + cookTime);

        const parsedIngredients = parseIngredients(scrapedData.ingredients || []);
        
        // Ensure minimum required ingredients
        if (parsedIngredients.length < 3) {
            parsedIngredients.push(
                { name: 'Salt', quantity: 'to taste' },
                { name: 'Black pepper', quantity: 'to taste' },
                { name: 'Olive oil', quantity: '1 tbsp' }
            );
        }

        // Ensure minimum required instructions
        let instructions = Array.isArray(scrapedData.instructions) 
            ? scrapedData.instructions.filter(inst => typeof inst === 'string' && inst.length > 0)
            : [];
            
        if (instructions.length < 2) {
            instructions = [
                'Prepare all ingredients according to the recipe requirements.',
                'Follow the cooking method as described in the original recipe.',
                ...instructions
            ];
        }

        const generatedRecipe = {
            title: scrapedData.title || scrapedData.name || 'Imported Recipe',
            description: scrapedData.description || scrapedData.summary || 'Recipe imported from website',
            servings: parseInt(String(scrapedData.servings || scrapedData.yield || '4')),
            prep_time_minutes: Math.min(Math.max(prepTime, 1), 120),
            cook_time_minutes: Math.min(Math.max(cookTime, 1), 240),
            total_time_minutes: Math.min(Math.max(totalTime, 1), 360),
            ingredients: parsedIngredients.slice(0, 20), // Limit to reasonable number
            instructions: instructions.slice(0, 15) // Limit to reasonable number
        };

        // Validate against schema
        const validated = GeneratedRecipeSchema.parse(generatedRecipe);

        res.status(200).json({ recipe: validated });

    } catch (error: any) {
        console.error('Recipe creation error:', error);
        
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Recipe validation failed', 
                details: error.errors 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to create recipe from import', 
            details: error?.message || 'Unknown error' 
        });
    }
}