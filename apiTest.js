const axios = require("axios");

// OpenAI API endpoint and your API key
const OPENAI_API_KEY =
  "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";
const OPENAI_API_URL = "https://api.openai.com/v1/completions";

// Function to get recipe suggestions based on pantry items
const getRecipeSuggestions = async (pantryItems) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "text-davinci-003", // Or any other available model
        prompt: `Suggest a recipe using the following ingredients: ${pantryItems.join(
          ", "
        )}. Include the recipe name, ingredients, and steps.`,
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const recipe = response.data.choices[0].text.trim();
    return recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return "Sorry, something went wrong. Please try again.";
  }
};

// Example usage
const pantryItems = ["chicken", "broccoli", "rice"];
getRecipeSuggestions(pantryItems).then((recipe) => {
  console.log(recipe);
});
