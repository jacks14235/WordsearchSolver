import numpy as np
from tqdm import tqdm
import json
import hashlib

# Load the JSON file
with open('usa2.json', 'r') as file:
  words_arr = json.load(file)
words = {}
for word in tqdm(words_arr):
  words[word] = True


def compare(embed, a, b):
  aa = embed[a]
  ba = embed[b]
  cos_sim = np.dot(aa, ba) / (np.linalg.norm(aa) * np.linalg.norm(ba))
  print(f'{a} and {b}: {cos_sim}')
  return cos_sim

embed = {}
with open('glove.twitter.27B.25d.txt', 'r') as f:
  with open('glove-twitter-25d.json', 'w') as w:
    w.write('{\n')
    lines = f.readlines()
    for line in tqdm(lines[:-1]):
      split = line.split()
      word = split[0]
      if words.get(word, None) is None:
        continue
      nums = [float(i) for i in split[1:]]
      w.write(f'"{str.upper(word)}":{nums},\n')
    line = lines[-1]
    split = line.split()
    nums = [float(i) for i in split[1:]]
    word = split[0]
    w.write(f'"{word}":{nums}\n')
    w.write('}')


# compare(embed, 'money', 'coin')
# compare(embed, 'money', 'dollar')
# compare(embed, 'money', 'dough')
# compare(embed, 'money', 'frog')