import json
import os
phase_list = []
folder = "neg"
state = json.load(open(f"{folder}/diplomacy_game_state.json","r"))
files = os.listdir(f"{folder}/maps")
full_phases = ["S1901M", "S1901R", "F1901M", "F1901R", "W1901A", "S1902M", "S1902R", "F1902M", "F1902R", "W1902A", "S1903M", "S1903R", "F1903M", "F1903R", "W1903A", "S1904M", "S1904R", "F1904M", "F1904R", "W1904A", "S1905M", "S1905R", "F1905M", "F1905R", "W1905A", "S1906M", "S1906R", "F1906M", "F1906R", "W1906A", "S1907M", "S1907R", "F1907M", "F1907R", "W1907A", "S1908M", "S1908R", "F1908M", "F1908R", "W1908A", "S1909M", "S1909R", "F1909M", "F1909R", "W1909A", "S1910M", "S1910R", "F1910M", "F1910R", "W1910A", "S1911M", "S1911R", "F1911M", "F1911R", "W1911A", "S1912M", "S1912R", "F1912M", "F1912R", "W1912A", "S1913M", "S1913R", "F1913M", "F1913R", "W1913A", "S1914M", "S1914R", "F1914M", "F1914R", "W1914A", "S1915M", "S1915R", "F1915M", "F1915R", "W1915A", "S1916M", "S1916R", "F1916M", "F1916R", "W1916A", "S1917M", "S1917R", "F1917M", "F1917R", "W1917A", "S1918M", "S1918R", "F1918M", "F1918R", "W1918A", "S1919M", "S1919R", "F1919M", "F1919R", "W1919A", "S1920M", "S1920R"]
for p in full_phases:
    if p + ".svg" in files:
        phase_list.append(p)
print(phase_list)
state["phase_list"] = phase_list
json.dump(state,open(f"{folder}/diplomacy_game_state.json","w"),indent=2)