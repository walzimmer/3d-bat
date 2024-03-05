from argparse import ArgumentParser
import os
from utils import resize_images

if __name__ == "__main__":
    arg_parser = ArgumentParser()
    arg_parser.add_argument("--input_folder_path_drive", type=str, required=True, help="Path to the input folder, e.g. drive_22_north_to_south")
    args = arg_parser.parse_args()
    input_folder_path_drive = args.input_folder_path_drive
    image_folder_paths = [
        os.path.join(input_folder_path_drive, 'images/s110_camera_basler_south2_8mm'),
        os.path.join(input_folder_path_drive, 'images/s110_camera_basler_south1_8mm'),
        os.path.join(input_folder_path_drive, 'images/s110_camera_basler_north_8mm'),
        os.path.join(input_folder_path_drive, 'images/s110_camera_basler_east_8mm'),
        os.path.join(input_folder_path_drive, 'images/vehicle_camera_basler_16mm'),
    ]
    resize_images(image_folder_paths)