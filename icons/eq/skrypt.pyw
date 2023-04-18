import os, json

with open('buildData.json', 'r', encoding='utf-8') as fp:
    data = json.load(fp)
    

for kat in next(os.walk('.'))[1]:
    for file in next(os.walk(kat))[2]:
        data[file[:-4]].append(kat)        

for key in tuple(data.keys()):
    if len(data[key]) <= 2:
        del data[key]


with open('buildData2.json', 'w', encoding='utf-8') as fp:
    data = json.dump(data, fp)
