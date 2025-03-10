import json
import os

change_model_name = {
    "sonnet": "Claude-3.5-Sonnet",
    "haiku": "Claude-3.5-Haiku",
    "llama3.3": "Llama3.3:70b",
    "gpt-4-turbo": "GPT-4-turbo",
    "gpt-4o": "GPT-4o",
    "ds": "Deepseek-R1",
}

folder_list = os.listdir("hanabi")
for folder in folder_list:
    new_name = folder[:-1]
    for k in change_model_name:
        if k in new_name:
            new_name = new_name.replace(k, change_model_name[k])
    
    os.system("mv hanabi/" + folder + " hanabi/" + new_name)