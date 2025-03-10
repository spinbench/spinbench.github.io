import json

import os
files = os.listdir("./")
for file in files:
    if ".py" in file:
        continue
    t = json.load(open(f"./{file}/trajectory.json","r"))
    for i in t:
        tokens = i["tokens"]
        tokens = tokens.replace("Life tokens = ", "").replace("Info tokens = ", "")

        d = {
            "life": int(tokens.split(",")[0]),
            "info": int(tokens.split(",")[1])
        }
        i["token_dict"] = d
    with open(f"./{file}/trajectory.json", "w") as f:
        json.dump(t, f, indent=4)
