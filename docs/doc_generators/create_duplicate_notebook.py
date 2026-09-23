"""
Create Duplicate Notebook: SmartAttend_AI_Project_Demonstration.ipynb
- Duplicates SmartAttend_AI_Teacher_Presentation.ipynb
- Removes all '🗣️ Viva Presentation Script:' sections cleanly
- Keeps all in-depth academic explanations, mathematical formulations, and code
- Pre-executes to embed all plots and accuracy numbers
"""

import re
import sys
import copy
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import nbformat
from nbclient import NotebookClient

# Load source notebook
src_path = "SmartAttend_AI_Teacher_Presentation.ipynb"
dst_path = "SmartAttend_AI_Project_Demonstration.ipynb"

nb = nbformat.read(src_path, as_version=4)

def clean_markdown(text):
    # Remove #### 🗣️ Viva Presentation Script... until next heading or end of block
    # Pattern: #### 🗣️ Viva Presentation Script.*?(?=(####|\n---|\Z))
    pattern = r"####\s+🗣️\s+Viva Presentation Script.*?(\n>.*?\n|\Z)(?=\n####|\n---|\Z)"
    cleaned = re.sub(pattern, "", text, flags=re.DOTALL)
    
    # In case there are other viva script variations
    cleaned = re.sub(r"####\s+🗣️\s+Viva Presentation Script[^\n]*\n(?:> [^\n]*\n?)+", "", cleaned)
    
    # Clean up double blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned

for cell in nb.cells:
    if cell.cell_type == "markdown":
        cell.source = clean_markdown(cell.source)

# Save duplicate
with open(dst_path, "w", encoding="utf-8") as f:
    nbformat.write(nb, f)

print(f"✅ Saved duplicate notebook to '{dst_path}'.")

# Pre-execute so all outputs and plots are 100% pre-rendered
print("⚙️ Pre-executing duplicate notebook to ensure all charts and outputs are embedded...")
client = NotebookClient(nb, timeout=300, kernel_name='python3')
client.execute()

with open(dst_path, "w", encoding="utf-8") as f:
    nbformat.write(nb, f)

print(f"🎉 SUCCESS! Duplicate '{dst_path}' created, stripped of Viva scripts, and fully executed with outputs!")
