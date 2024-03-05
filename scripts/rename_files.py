import os

path_in = "../input/providentia/2021_02_11_11_32_00_s50_near/annotations/"

idx = 0
for file in sorted(os.listdir(path_in)):
    os.rename(path_in+file,path_in+str(idx).zfill(6)+".json")
    idx=idx+1