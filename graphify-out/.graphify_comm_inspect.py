import json
from pathlib import Path

analysis = json.loads(Path("graphify-out/.graphify_analysis.json").read_text(encoding="utf-8"))
communities = analysis["communities"]
# Print community sizes and sample node labels
for cid, nodes in sorted(communities.items(), key=lambda x: -len(x[1])):
    print("Community " + cid + " (" + str(len(nodes)) + " nodes): " + str(nodes[:4]))
