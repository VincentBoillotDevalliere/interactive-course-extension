#!/usr/bin/env python3
import json
import os
import glob

# Directory paths
base_dir = '/Users/vincentboillotdevalliere/Documents/interactive-course-extension/interactive-course-extension/src/assets/exercises'

# Get all JSON files in the exercises directory
json_files = glob.glob(os.path.join(base_dir, '*.json'))

for json_file in json_files:
    # Get the chapter name (filename without extension)
    chapter_name = os.path.basename(json_file).replace('.json', '')
    chapter_dir = os.path.join(base_dir, chapter_name)
    
    # Read the JSON file
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    # Extract chapter metadata
    chapter_metadata = {
        "id": data["id"],
        "title": data["title"],
        "resources": data.get("resources", {})
    }
    
    # Write chapter metadata file
    with open(os.path.join(chapter_dir, 'chapter-info.json'), 'w') as f:
        json.dump(chapter_metadata, f, indent=2)
    
    # Split each exercise into a separate file
    for exercise in data.get("exercises", []):
        exercise_name = exercise["name"]
        exercise_file = os.path.join(chapter_dir, f"{chapter_name}-{exercise_name}.json")
        
        # Add the chapter ID to the exercise
        exercise["chapterId"] = data["id"]
        
        # Write the exercise file
        with open(exercise_file, 'w') as f:
            json.dump(exercise, f, indent=2)
    
    print(f"Processed chapter: {chapter_name}")

print("All chapters processed successfully!")
