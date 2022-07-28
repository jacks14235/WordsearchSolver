# creates artificial training set for letter identification

from cmath import exp
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import random
import os

letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

for i in range(len(letters)):
    try:
        os.mkdir('./src/python/images/' + letters[i])
    except OSError:
        pass

resolution = (28, 28)
padding = (2, 2)
IMAGES_PER_FONT = 10

def create_image(num, letter, fontpath, blur=0):
    gray = 255 # random.randint(200, 255)
    img = Image.new('L', resolution, gray)
    draw = ImageDraw.Draw(img)
    fill = 0 # random.randint(0, 127)
    font = ImageFont.truetype(fontpath, 28)
    draw.text((resolution[0] / 2, resolution[1] / 2), letter, fill=fill, font=font, anchor='mm')
    rotate = random.normalvariate(0, 4)
    rotated = img.rotate(rotate, expand=True, fillcolor=gray)
    blurred = rotated.filter(ImageFilter.GaussianBlur(blur))
    blurred.save('./src/python/images/'+letter+'/image_' + str(num).zfill(3) + '.png')

for i in range(len(letters)):
    c = 0
    for f in os.listdir('./src/python/fonts'):
        if (not f.endswith('.ttf')):
            continue
        for j in range(IMAGES_PER_FONT):
            create_image(c, letters[i], './src/python/fonts/' + f, blur=random.randint(0,2) / 2)
            c += 1
    print(letters[i], end="")
print()