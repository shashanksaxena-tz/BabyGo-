import os
import json

def read_files_in_dir(directory, extensions):
    results = []
    for root, dirs, files in os.walk(directory):
        if "node_modules" in root or ".git" in root or ".next" in root or "build" in root or "dist" in root:
            continue
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                        results.append({"path": filepath, "size": len(content), "content": content})
                except Exception as e:
                    pass
    return results

def analyze_backend():
    print("--- Backend Analysis ---")
    files = read_files_in_dir("backend", [".js", ".ts"])
    routes = [f for f in files if "route" in f["path"].lower() or "controller" in f["path"].lower()]
    print(f"Found {len(files)} total backend files. {len(routes)} appear to be routes/controllers.")

    # Check for direct LLM calls in routes
    direct_calls = 0
    for f in routes:
        if "gemini" in f["content"].lower() or "openai" in f["content"].lower():
            direct_calls += 1
            print(f"Warning: Direct AI API call found in {f['path']}")

    print("--- Frontend (React) Analysis ---")
    files = read_files_in_dir("tinysteps-ai", [".js", ".jsx", ".ts", ".tsx"])
    components = [f for f in files if "component" in f["path"].lower() or "screen" in f["path"].lower() or "page" in f["path"].lower()]
    print(f"Found {len(files)} total React files. {len(components)} appear to be UI components.")

    # Check for excessive dashboard options
    for f in files:
        if "dashboard" in f["path"].lower() or "home" in f["path"].lower():
            links = f["content"].count("<Link") + f["content"].count("<button") + f["content"].count("<Button")
            if links > 10:
                print(f"UX Warning: File {f['path']} contains {links} actionable elements. Suggests 'a la carte' design.")

    print("--- Mobile (Flutter) Analysis ---")
    files = read_files_in_dir("tinysteps_flutter", [".dart"])
    print(f"Found {len(files)} total Flutter files.")

analyze_backend()
