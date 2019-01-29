import h5py

filename = '/media/cvrr/161d15ca-26dc-4d36-b085-945b15ce24b8/sandbox/datasets/lisat/data/velodyne/velodyne_compact.h5'
f = h5py.File(filename, 'r')


# Get the data
timestamps_velo = list(f['/timestamp'])

# iterate all timestamps
for timestamp_velo in timestamps_velo:

print(data)