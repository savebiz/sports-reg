import re
import os

with open("FaithTribe_Sports_Registration_Portal.html", "r", encoding="utf-8") as f:
    content = f.read()

# Extract CSS
css_match = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
if css_match:
    css_content = css_match.group(1)
    with open("styles.css", "w", encoding="utf-8") as f:
        f.write(css_content)

# Extract JS
js_match = re.search(r"<script>(.*?)</script>", content, re.DOTALL)
if js_match:
    js_content = js_match.group(1)
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(js_content)

# Extract HTML
html_content = re.sub(r"<style>.*?</style>", '<link rel="stylesheet" href="styles.css">', content, flags=re.DOTALL)
html_content = re.sub(r"<script>.*?</script>", '<script src="app.js"></script>', html_content, flags=re.DOTALL)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

os.remove("FaithTribe_Sports_Registration_Portal.html")
print("Extraction complete.")
