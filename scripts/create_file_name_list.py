from argparse import ArgumentParser
import os
from utils import *


if __name__ == "__main__":
    arg_parser = ArgumentParser()
    arg_parser.add_argument("--input_folder_path_drive", type=str, required=True, help="Path to the input folder, e.g. drive_22_north_to_south")
    args = arg_parser.parse_args()
    input_folder_path_drive = args.input_folder_path_drive
    # create file name (.txt files) for drive
    create_files(input_folder_path_drive)


    # create empty annotations for each drive
#     sequences = ['drive_33_north_to_south']
#
#     for seq in sequences:
#         seq_path = os.path.join(input_folder_path_drives, seq)
#         annos_path = os.path.join(seq_path, 'annotations')
#
#         lidar_channels = [i for i in os.listdir(annos_path) if 'lidar' in i]
#         anno_files = sorted(glob.glob(os.path.join(annos_path, lidar_channels[0], '*.json')))
#
#         for anno_file in anno_files:
#             with open(anno_file, 'r') as f:
#                 data = json.load(f)
#
#             frame_idx = list(data['openlabel']['frames'])[0]
#             data['openlabel']['frames'][frame_idx]['objects'] = {}
#
#
#             with open(anno_file, 'w') as f:
#                 json.dump(data, f)
