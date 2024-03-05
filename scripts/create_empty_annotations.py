import json
import os
import time
import argparse

def create_empty_annotations(input_folder_path_point_clouds, output_folder_path_annotations):
    for root, dirs, files in os.walk(input_folder_path_point_clouds):
        for file in files:
            if file.endswith(".pcd"):
                anno = {
                    "openlabel": {
                        "metadata": {
                            "schema_version": "1.0.0"
                        },
                        "frames": {
                            "0": {
                                "objects": {},
                                "frame_properties": {
                                    "image_file_names": []
                                }
                            }
                        }
                    }
                }
                with open(os.path.join(output_folder_path_annotations, file.replace(".pcd", ".json")), "w") as f:
                    json.dump(anno, f)


if __name__ == "__main__":
    argparser = argparse.ArgumentParser(
        description='Create empty annotations for openLabel')
    argparser.add_argument(
        '--input_folder_path_point_clouds',
        type=str,
        default="",
        help='Input folder path to point clouds')
    argparser.add_argument(
        '--output_folder_path_annotations',
        type=str,
        default=".",
        help='Output folder path to annotations')
    args = argparser.parse_args()
    input_folder_path_point_clouds = args.input_folder_path_point_clouds
    output_folder_path_annotations = args.output_folder_path_annotations

    create_empty_annotations(input_folder_path_point_clouds, output_folder_path_annotations)
