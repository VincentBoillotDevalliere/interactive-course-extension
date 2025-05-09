#!/usr/bin/env python3
"""
Migration Script for Interactive Course Extension

This script helps migrate from the old single-file structure to the new chapter-based structure.
It takes all existing exercise JSON files and:
1. Creates a chapter directory for each file
2. Creates a chapter-info.json with metadata
3. Splits each exercise into individual JSON files

Usage:
    python3 migrate_to_chapters.py

Author: Vincent Boillot Devalliere
"""

import json
import os
import sys
import glob
import shutil

def migrate_to_chapters():
    """Migrate from old structure to new chapter-based structure"""
    # Directory paths
    extension_path = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.join(extension_path, 'src', 'assets', 'exercises')
    markdown_dir = os.path.join(extension_path, 'src', 'assets', 'templates', 'markdown')
    chapters_dir = os.path.join(extension_path, 'src', 'assets', 'templates', 'chapters')
    
    # Create chapters directory if it doesn't exist
    if not os.path.exists(chapters_dir):
        os.makedirs(chapters_dir)
    
    # Get all JSON files in the exercises directory (not in subdirectories)
    json_files = [f for f in glob.glob(os.path.join(base_dir, '*.json')) 
                  if os.path.dirname(f) == base_dir]
    
    if not json_files:
        print("No JSON files found in the exercises directory. Already migrated?")
        return
    
    print(f"Found {len(json_files)} JSON files to migrate")
    
    for json_file in json_files:
        # Get the chapter name (filename without extension)
        chapter_name = os.path.basename(json_file).replace('.json', '')
        chapter_dir = os.path.join(base_dir, chapter_name)
        
        print(f"Processing chapter: {chapter_name}")
        
        # Create backup before processing
        backup_dir = os.path.join(base_dir, 'backup')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        backup_file = os.path.join(backup_dir, os.path.basename(json_file))
        shutil.copy2(json_file, backup_file)
        print(f"  - Backed up {os.path.basename(json_file)} to backup directory")
        
        # Read the JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        # Create chapter directory
        if not os.path.exists(chapter_dir):
            os.makedirs(chapter_dir)
            print(f"  - Created directory: {chapter_dir}")
        
        # Extract chapter metadata
        chapter_metadata = {
            "id": data["id"],
            "title": data["title"],
            "resources": data.get("resources", {})
        }
        
        # Write chapter metadata file
        chapter_info_path = os.path.join(chapter_dir, 'chapter-info.json')
        with open(chapter_info_path, 'w') as f:
            json.dump(chapter_metadata, f, indent=2)
        print(f"  - Created chapter-info.json")
        
        # Split each exercise into a separate file
        for exercise in data.get("exercises", []):
            exercise_name = exercise["name"]
            exercise_file = os.path.join(chapter_dir, f"{chapter_name}-{exercise_name}.json")
            
            # Add the chapter ID to the exercise
            exercise["chapterId"] = data["id"]
            
            # Write the exercise file
            with open(exercise_file, 'w') as f:
                json.dump(exercise, f, indent=2)
            print(f"  - Created exercise file: {os.path.basename(exercise_file)}")
        
        # Move the markdown file to the chapters directory if it exists
        markdown_file = os.path.join(markdown_dir, f"{chapter_name}.md")
        if os.path.exists(markdown_file):
            chapter_markdown = os.path.join(chapters_dir, f"{chapter_name}.md")
            shutil.copy2(markdown_file, chapter_markdown)
            print(f"  - Copied markdown file to chapters directory")
    
    print("\nMigration completed successfully!")
    print("You can verify the new structure and then remove the files in the backup directory.")

if __name__ == "__main__":
    print("Starting migration to chapter-based structure...")
    try:
        migrate_to_chapters()
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        sys.exit(1)
