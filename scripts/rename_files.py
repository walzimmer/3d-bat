import os
path = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/3D_Bounding_Box_Annotation_Tool_3D_BAT/input/PCDPoints/'
i=0
for file in sorted(os.listdir(path)):
  os.rename(path+file,path+str(i).zfill(6)+'.bin')
  i=i+1
