import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for
from data.recipes import recipes

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route('/')
def index():
    """Render the home page with all recipes."""
    categories = sorted(list(set(category for recipe in recipes for category in recipe['categories'])))
    return render_template('index.html', recipes=recipes, categories=categories)

@app.route('/recipe/<int:recipe_id>')
def recipe_detail(recipe_id):
    """Render the recipe detail page."""
    if 0 <= recipe_id < len(recipes):
        return render_template('recipe.html', recipe=recipes[recipe_id], recipe_id=recipe_id)
    return redirect(url_for('index'))

@app.route('/api/search')
def search_recipes():
    """API endpoint to search recipes by query or category."""
    query = request.args.get('query', '').lower()
    category = request.args.get('category', '').lower()
    
    results = []
    for recipe in recipes:
        # Search by query
        if query and (query in recipe['title'].lower() or 
                      any(query in ingredient.lower() for ingredient in recipe['ingredients'])):
            results.append(recipe)
        # Search by category
        elif category and category in [c.lower() for c in recipe['categories']]:
            results.append(recipe)
    
    if not query and not category:
        results = recipes
        
    return jsonify(results)

@app.route('/api/recipe/<int:recipe_id>')
def get_recipe(recipe_id):
    """API endpoint to get a specific recipe."""
    if 0 <= recipe_id < len(recipes):
        return jsonify(recipes[recipe_id])
    return jsonify({"error": "Recipe not found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
