# utitlity to unzip fonts from /fonts/zips and put
# ttfs into /fonts

import os, zipfile
dir = './src/python/fonts/zips'
print(os.getcwd())
# extract all zips
prefix = os.getcwd() + dir[1:] + '/'
for f in os.listdir(dir):
    if f.endswith('.zip'):
        print(f)
        filename = prefix + f
        print(filename)
        zip_ref = zipfile.ZipFile(filename)
        zip_ref.extractall(dir) 
        zip_ref.close()
        os.remove(filename) 


# move all ttf files and delete others
prefix = os.getcwd() + '/src/python/fonts'
for f in os.listdir(dir):
    if f.endswith('.ttf'):
        os.replace(prefix + '/zips/' + f, prefix + '/' + f)
    else:
        os.remove(prefix + '/zips/' + f)

