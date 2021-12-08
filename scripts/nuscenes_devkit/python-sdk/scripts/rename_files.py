import os

path = "../../../../input/providentia/20210302_sequence/point_clouds/"

files = sorted(os.listdir(path))
idx=0
for file in files:
  os.rename(path+file,path+str(idx).zfill(6)+".pcd")
  idx=idx+1
