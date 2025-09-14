#!/usr/bin/env node

// Test script for parallel track functionality
// Run with: node src/test-parallel-tracks.mjs

const testRecipes = [
  {
    title: "Spaghetti Carbonara",
    instructions: [
      "Bring a large pot of salted water to boil",
      "Meanwhile, cook pancetta in a pan until crispy", 
      "In a bowl, whisk eggs with grated parmesan",
      "Add spaghetti to boiling water and cook according to package",
      "Reserve 1 cup pasta water before draining",
      "Add hot pasta to pancetta pan",
      "Remove from heat and quickly stir in egg mixture", 
      "Add pasta water to achieve creamy consistency",
      "Season with black pepper and serve"
    ],
    expectedTracks: ["pasta", "sauce", "egg_mixture", "aromatics"],
    expectedGranularity: [
      "Fill large pot with water",
      "Add salt to water", 
      "Heat water over high heat",
      "Cut pancetta into small cubes",
      "Heat pan over medium heat",
      "Add pancetta to heated pan",
      "Cook pancetta 4-5 minutes until crispy",
      "Crack eggs into mixing bowl",
      "Grate parmesan cheese",
      "Whisk eggs and parmesan together"
    ]
  },
  {
    title: "Pan-Seared Chicken with Roasted Vegetables and Rice Pilaf",
    instructions: [
      "Season chicken breasts and marinate for 20 minutes",
      "Preheat oven to 425°F for vegetables",
      "Start rice pilaf by toasting rice in butter",
      "Chop vegetables for roasting",
      "Toss vegetables with oil and seasonings",
      "Put vegetables in oven to roast",
      "Add broth to rice and let simmer",
      "Heat pan for chicken while vegetables roast",
      "Sear chicken in hot pan until golden",
      "Flip chicken and finish cooking",
      "Let chicken rest while checking rice and vegetables",
      "Make pan sauce with drippings",
      "Plate everything together with fresh herbs"
    ],
    expectedTracks: ["chicken", "vegetables", "rice", "sauce", "oven_prep", "garnish"],
    expectedGranularity: [
      "Pat chicken breasts dry",
      "Season chicken with salt and pepper on both sides", 
      "Place chicken in marinade",
      "Preheat oven to 425°F",
      "Melt butter in saucepan over medium heat",
      "Add rice to melted butter",
      "Toast rice for 2 minutes stirring constantly",
      "Wash and chop carrots into 1-inch pieces",
      "Wash and chop Brussels sprouts in half",
      "Toss vegetables with olive oil in bowl",
      "Season vegetables with salt and pepper",
      "Spread vegetables on baking sheet"
    ]
  }
];

async function testParallelParsing() {
  console.log("🧪 Testing Parallel Track Parsing\n");
  console.log("=" .repeat(50));

  for (const recipe of testRecipes) {
    console.log(`\n📖 Testing: ${recipe.title}`);
    console.log("-".repeat(40));
    
    try {
      const response = await fetch("http://localhost:3000/api/recipe/parse-parallel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe: `${recipe.title}\n\nInstructions:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          requirements: "Parse into parallel cooking tracks"
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      console.log(`✅ Successfully parsed into ${data.graph.tracks.length} tracks:`);
      
      data.graph.tracks.forEach(track => {
        console.log(`   📍 ${track.emoji || "🍳"} ${track.title}: ${track.steps.length} steps`);
        track.steps.forEach(step => {
          const timing = step.duration_minutes ? ` (${step.duration_minutes}min)` : '';
          console.log(`      - Step ${step.number}: ${step.instruction.substring(0, 65)}${timing}`);
        });
      });
      
      if (data.graph.joins.length > 0) {
        console.log(`   🔗 ${data.graph.joins.length} join points:`);
        data.graph.joins.forEach(join => {
          console.log(`      - ${join.title}: combines ${join.depends_on.join(", ")}`);
        });
      }
      
      // Check if expected tracks were found
      const trackIds = data.graph.tracks.map(t => t.track_id.toLowerCase());
      const foundExpected = recipe.expectedTracks.filter(expected => 
        trackIds.some(id => id.includes(expected) || expected.includes(id))
      );
      
      if (foundExpected.length > 0) {
        console.log(`   ✨ Found expected tracks: ${foundExpected.join(", ")}`);
      }
      
      // Check granularity by counting total steps vs original steps
      const totalGeneratedSteps = data.graph.tracks.reduce((sum, track) => sum + track.steps.length, 0);
      const originalSteps = recipe.instructions.length;
      const granularityRatio = (totalGeneratedSteps / originalSteps).toFixed(1);
      
      console.log(`   📊 Granularity: ${totalGeneratedSteps} steps from ${originalSteps} original (${granularityRatio}x expansion)`);
      
      // Count steps with timing
      const timedSteps = data.graph.tracks.reduce((sum, track) => 
        sum + track.steps.filter(s => s.duration_minutes).length, 0
      );
      console.log(`   ⏱️  Timing: ${timedSteps}/${totalGeneratedSteps} steps have duration data`);
      
    } catch (error) {
      console.error(`❌ Error testing ${recipe.title}:`, error.message);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("🏁 Test completed!\n");
}

// Test batch generation with tracks
async function testBatchGeneration() {
  console.log("\n🧪 Testing Batch Generation with Parallel Tracks\n");
  console.log("=".repeat(50));
  
  try {
    const response = await fetch("http://localhost:3000/api/chat/generateBatchWithTracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirements: "Quick weeknight dinners",
        prompt: "30-minute meals with parallel cooking steps",
        limit: 2
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const recipes = await response.json();
    
    console.log(`✅ Generated ${recipes.length} recipes with parallel tracks:\n`);
    
    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title}`);
      console.log(`   ${recipe.description}`);
      console.log(`   ⏱️  ${recipe.total_time_minutes} minutes total`);
      
      if (recipe.graph) {
        console.log(`   📊 ${recipe.graph.tracks.length} parallel tracks:`);
        recipe.graph.tracks.forEach(track => {
          console.log(`      - ${track.emoji || "🍳"} ${track.title}: ${track.steps.length} steps`);
        });
        
        if (recipe.graph.joins.length > 0) {
          console.log(`   🔗 ${recipe.graph.joins.length} combination points`);
        }
      }
      console.log();
    });
    
  } catch (error) {
    console.error("❌ Error testing batch generation:", error.message);
  }
  
  console.log("=".repeat(50));
  console.log("🏁 Batch generation test completed!\n");
}

// Run tests
async function runAllTests() {
  console.log("🚀 Starting Parallel Tracks Test Suite\n");
  
  // Uncomment to test individual recipe parsing
  // await testParallelParsing();
  
  // Test batch generation
  await testBatchGeneration();
  
  console.log("✨ All tests completed!");
}

runAllTests().catch(console.error);