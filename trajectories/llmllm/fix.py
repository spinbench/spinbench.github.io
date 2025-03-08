import json
import glob

f = glob.glob("chess/*/*.json")
for i in f:
    t= json.load(open(i, "r"))
    for j in t:
        j["image_path"] = j["image"].split("/")[-1]
    json.dump(t, open(i, "w"), indent=4)

