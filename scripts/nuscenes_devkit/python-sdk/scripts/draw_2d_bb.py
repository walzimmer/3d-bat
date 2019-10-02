from PIL import Image, ImageDraw

image_path_in = '/path/to/CAM_BACK/000000.jpg'
image_path_out = '/output/000000.jpg'

bb = [711.2052971998752, 379.53076863504674, 1008.7345435520874, 570.4641298240495]

img = Image.open(image_path_in)
# im = Image.new('RGBA', (400, 400), (0, 255, 0, 0))
draw = ImageDraw.Draw(img)
draw.line((bb[0], bb[1], bb[0], bb[3]), fill='#00ff00')
draw.line((bb[0], bb[3], bb[2], bb[3]), fill='#00ff00')
draw.line((bb[2], bb[3], bb[2], bb[1]), fill='#00ff00')
draw.line((bb[2], bb[1], bb[0], bb[1]), fill='#00ff00')
img.save(image_path_out)
