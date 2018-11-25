import os
file_path_out = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/nuscenes-devkit/python-sdk/scripts/scene-0002_small.obj'
file_path_in = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/nuscenes-devkit/python-sdk/scripts/scene-0002.obj'
i=0
with open(file_path_out,'w') as file_writer:
    with open(file_path_in) as file_reader:
        lines = file_reader.readlines()
        for line in lines:
            if i%10==0:
                file_writer.write(line)
            i=i+1