import os

# sequence = '2018-05-23-001-frame-00042917-00043816' # DONE
# sequence = '2018-05-23-001-frame-00077323-00078222' # DONE
# sequence = '2018-05-23-001-frame-00080020-00080919' # DONE
sequence = '2018-05-23-001-frame-00106993-00107892'
path_in = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/pointclouds/'
path_out = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/' + sequence + '/pointclouds_without_ground/'
for file in sorted(os.listdir(path_in)):
    lines = []
    pointcloud_without_ground = []
    with open(path_in + file) as file_reader:
        lines = file_reader.readlines()
    for i in range(len(lines)):
        if i < 11:
            continue
        point_array = lines[i].split(" ")
        z_value = float(point_array[2])
        if z_value > -1.4478:  # removes half of the ground
            # if z_value > -1:
            pointcloud_without_ground.append(lines[i])

    # write header
    num_points = len(pointcloud_without_ground)
    with open(path_out + file, 'w') as file_writer:
        file_writer.write("# .PCD v0.7 - Point Cloud Data file format\n"
                          + "VERSION 0.7\n"
                          + "FIELDS x y z intensity\n"
                          + "SIZE 4 4 4 4\n"
                          + "TYPE F F F F\n"
                          + "COUNT 1 1 1 1\n"
                          + "WIDTH " + str(num_points) + "\n"
                          + "HEIGHT 1\n"
                          + "VIEWPOINT 0 0 0 1 0 0 0\n"
                          + "POINTS " + str(num_points) + "\n"
                          + "DATA ascii\n")
        for line in pointcloud_without_ground:
            file_writer.write(line)
