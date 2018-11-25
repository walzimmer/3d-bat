from PIL import Image, ImageDraw

image_path_in = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/JPEGImages/CAM_BACK/000000.jpg'
image_path_out = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/output/000000.jpg'

bb = [711.2052971998752, 379.53076863504674, 1008.7345435520874, 570.4641298240495]

img = Image.open(image_path_in)
# im = Image.new('RGBA', (400, 400), (0, 255, 0, 0))
draw = ImageDraw.Draw(img)
draw.line((bb[0], bb[1], bb[0], bb[3]), fill='#00ff00')
draw.line((bb[0], bb[3], bb[2], bb[3]), fill='#00ff00')
draw.line((bb[2], bb[3], bb[2], bb[1]), fill='#00ff00')
draw.line((bb[2], bb[1], bb[0], bb[1]), fill='#00ff00')
img.save(image_path_out)
