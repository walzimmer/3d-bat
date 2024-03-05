import os
import glob
import json
import cv2
import matplotlib.pyplot as plt
import matplotlib as mpl
import mayavi.mlab as mlab
import numpy as np
import open3d as o3d
from scipy.spatial.transform import Rotation as R


id_to_class_name_mapping = {
    "0": {
        "class_label_de": "PKW",
        "class_label_en": "Car",
        "color_hex": "#00ccf6",
        "color_rgb": (0, 204, 246),
        "color_bgr": (246, 204, 0),
        "color_bgr_normalized": (0.964705882, 0.8, 0),
        "color_rgb_normalized": (0, 0.8, 0.96),
    },
    "1": {
        "class_label_de": "LKW",
        "class_label_en": "Truck",
        "color_hex": "#3FE9B9",
        "color_rgb": (63, 233, 185),
        "color_bgr": (185, 233, 63),
        "color_bgr_normalized": (0.71372549, 1, 0.337254902),
        "color_rgb_normalized": (0.25, 0.91, 0.72),
    },
    "2": {
        "class_label_de": "Anhänger",
        "class_label_en": "Trailer",
        "color_hex": "#5AFF7E",
        "color_rgb": (90, 255, 126),
        "color_bgr": (126, 255, 90),
        "color_bgr_normalized": (0.494117647, 1, 0.352941176),
        "color_rgb_normalized": (0.35, 1, 0.49),
    },
    "3": {
        "class_label_de": "Van",
        "class_label_en": "Van",
        "color_hex": "#EBCF36",
        "color_rgb": (235, 207, 54),
        "color_bgr": (54, 207, 235),
        "color_bgr_normalized": (0.211764706, 0.811764706, 0.921568627),
        "color_rgb_normalized": (0.92, 0.81, 0.21),
    },
    "4": {
        "class_label_de": "Motorrad",
        "class_label_en": "Motorcycle",
        "color_hex": "#B9A454",
        "color_rgb": (185, 164, 84),
        "color_bgr": (84, 164, 185),
        "color_bgr_normalized": (0.329411765, 0.643137255, 0.725490196),
        "color_rgb_normalized": (0.72, 0.64, 0.33),
    },
    "5": {
        "class_label_de": "Bus",
        "class_label_en": "Bus",
        "color_hex": "#D98A86",
        "color_rgb": (217, 138, 134),
        "color_bgr": (134, 138, 217),
        "color_bgr_normalized": (0.525490196, 0.541176471, 0.850980392),
        "color_rgb_normalized": (0.85, 0.54, 0.52),
    },
    "6": {
        "class_label_de": "Person",
        "class_label_en": "Pedestrian",
        "color_hex": "#E976F9",
        "color_rgb": (233, 118, 249),
        "color_bgr": (249, 118, 233),
        "color_bgr_normalized": (0.976470588, 0.462745098, 0.91372549),
        "color_rgb_normalized": (0.91, 0.46, 0.97),
    },
    "7": {
        "class_label_de": "Fahrrad",
        "class_label_en": "Bicycle",
        "color_hex": "#B18CFF",
        "color_rgb": (177, 140, 255),
        "color_bgr": (255, 140, 177),
        "color_bgr_normalized": (1, 0.549019608, 0.694117647),
        "color_rgb_normalized": (0.69, 0.55, 1),
    },
}

class_name_to_id_mapping = {
    "CAR": 0,
    "TRUCK": 1,
    "TRAILER": 2,
    "VAN": 3,
    "MOTORCYCLE": 4,
    "BUS": 5,
    "PEDESTRIAN": 6,
    "BICYCLE": 7,
}

def rename_files_by_timestamps_only(seq_dir):
    annos_dir = os.path.join(seq_dir, 'annotations')
    pcd_dir = os.path.join(seq_dir, 'point_clouds')

    lidar_name = os.listdir(pcd_dir)[0]






def create_files(input_folder_path_drive):
    channel_names = os.listdir(os.path.join(input_folder_path_drive, 'images'))
    channel_names = [i for i in channel_names if 'camera' in i]

    ext = sorted(glob.glob(os.path.join(input_folder_path_drive, 'images', channel_names[0], '*')))[0].split('.')[-1]
    for channel in channel_names:
        txt_file = os.path.join(input_folder_path_drive, f'{channel}_filenames.txt')
        img_filenames = sorted(glob.glob(os.path.join(input_folder_path_drive, 'images', channel, f'*.{ext}')))
        img_filenames = [i.split('/')[-1] for i in img_filenames]
        with open(txt_file, 'w') as img_writer:
            for name in img_filenames:
                img_writer.write(name + '\n')

    lidar_channels = os.listdir(os.path.join(input_folder_path_drive, 'point_clouds'))
    lidar_channels = [i for i in lidar_channels if 'lidar' in i]

    pcd_txt = os.path.join(input_folder_path_drive, 'point_cloud_filenames.txt')
    if len(lidar_channels) == 0:
        pcd_filenames = sorted(glob.glob(os.path.join(input_folder_path_drive, 'point_clouds', '*.pcd')))
    else:
        pcd_filenames = sorted(glob.glob(os.path.join(input_folder_path_drive, 'point_clouds', lidar_channels[0], '*.pcd')))

    pcd_filenames = [i.split('/')[-1] for i in pcd_filenames]
    with open(pcd_txt, 'w') as pcd_writer:
        for name in pcd_filenames:
            pcd_writer.write(name + '\n')

    anno_dir = os.path.join(input_folder_path_drive, 'annotations','s110_lidar_ouster_south_and_vehicle_lidar_robosense_registered')
    annotation_file_names = sorted(glob.glob(os.path.join(anno_dir, '*.json')))
    annotation_file_names = [i.split('/')[-1] for i in annotation_file_names]
    annos_txt = os.path.join(input_folder_path_drive, 'annotation_filenames.txt')
    with open(annos_txt, 'w') as annos_writer:
        for annotation_file_name in annotation_file_names:
            annos_writer.write(annotation_file_name + '\n')



def create_empty_annotations(img_filenames):
    for image_file in img_filenames:
        timestamp_secs = image_file.split("_")[0]
        timestamp_nsecs = image_file.split("_")[1]

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
        with open(SEQ_PATH + "/annotations/" + timestamp_secs + "_" + timestamp_nsecs + ".json", "w") as f:
            json.dump(anno, f)




def visualize_pcd(pcd_path):
    azimuth = 180
    elevation = 70
    distance = 30.0

    pts_color = None
    pts_scale = 1
    pts_mode = 'point'

    pcd = convert_pcd_to_bin(pcd_path)

    fig = mlab.figure(figure="pointcloud",
                      size=(800, 600),
                      bgcolor=(0, 0, 0))
    mlab.clf(figure=None)

    color = pcd[:, 0]

    mlab.points3d(
        pcd[:, 0], pcd[:, 1], pcd[:, 2], color,
        color=pts_color, mode=pts_mode, colormap='rainbow',
        scale_factor=pts_scale, figure=fig
    )
    mlab.points3d(0, 0, 0, color=(1, 1, 1), mode='sphere', scale_factor=0.2)
    axes = np.array([
        [2.0, 0.0, 0.0, 0.0],
        [0.0, 2.0, 0.0, 0.0],
        [0.0, 0.0, 2.0, 0.0],
    ], dtype=np.float32)

    mlab.plot3d([0, axes[0, 0]], [0, axes[0, 1]], [0, axes[0, 2]], color=(1, 0, 0), tube_radius=None, figure=fig)
    mlab.plot3d([0, axes[1, 0]], [0, axes[1, 1]], [0, axes[1, 2]], color=(0, 1, 0), tube_radius=None, figure=fig)
    mlab.plot3d([0, axes[2, 0]], [0, axes[2, 1]], [0, axes[2, 2]], color=(0, 0, 1), tube_radius=None, figure=fig)

    mlab.view(azimuth=azimuth,
              elevation=elevation,
              focalpoint=[0, 0, 0],
              distance=distance,
              figure=fig)

    return fig


def draw_2d_box_on_image(corner_pts, img_path, cam='basler_1'):
    """
    draws a 2D bounding box on an image
    :param pts:
    :param img_path:
    :return:
    """
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    height, width = img.shape[:2]

    if cam == 'basler_1':
        # perspective projection
        proj_mat = np.asarray(BASLER_1_PROJECTION)
        proj_mat_hom = np.vstack((proj_mat, np.array([0, 0, 0, 1])))

        # transformation from lidar coordinate frame to camera coordinate frame
        tr_lidar_cam = np.asarray(TR_LIDAR_BASLER_1)
        tr_lidar_cam_hom = np.vstack((tr_lidar_cam, np.asarray([0, 0, 0, 1])))

        # combined transformation
        combined_tr = np.dot(proj_mat_hom, tr_lidar_cam_hom)[:3, :]
    else:
        # perspective projection
        proj_mat = np.asarray(BASLER_2_PROJECTION)
        proj_mat_hom = np.vstack((proj_mat, np.array([0, 0, 0, 1])))

        # transformation from lidar coordinate frame to camera coordinate frame
        tr_lidar_cam = np.asarray(TR_LIDAR_BASLER_2)
        tr_lidar_cam_hom = np.vstack((tr_lidar_cam, np.asarray([0, 0, 0, 1])))

        # combined transformation
        combined_tr = np.dot(proj_mat_hom, tr_lidar_cam_hom)[:3, :]

    projected_corner_pts = {}
    for key, val in corner_pts.items():
        pt = np.asarray(val).reshape(1, -1)
        pt_hom = np.hstack((pt, np.ones((pt.shape[0], 1))))

        pt_proj_hom = np.dot(pt_hom, combined_tr.T)[0]
        pt_proj = pt_proj_hom[:2] / pt_proj_hom[2]

        projected_corner_pts[key] = pt_proj

    for line_name in LINES_3D_PROVIDENTIA:
        start_point = projected_corner_pts[line_name.split('/')[0]]
        end_point = projected_corner_pts[line_name.split('/')[1]]

        draw_2d_line(img,
                     (
                         int(start_point[0] * IMAGE_SCALE_FACTOR),
                         int(start_point[1] * IMAGE_SCALE_FACTOR)
                     ),
                     (
                         int(end_point[0] * IMAGE_SCALE_FACTOR),
                         int(end_point[1] * IMAGE_SCALE_FACTOR)
                     ),
                     color=(1, 0, 0))

    plt.imshow(img)
    plt.show()


def draw_3d_box_on_pcd(corner_pts, pcd_path):
    """
    draws a 3D bounding box on a pointcloud
    :param corner_pts: the corner points of the 3D bounding box in the OpenLabel order
    :param pcd_path: the path to the point cloud
    :return: None
    """
    azimuth = 180
    elevation = 70
    distance = 30.0

    pts_color = None
    pts_scale = 1
    pts_mode = 'point'

    pcd = convert_pcd_to_bin(pcd_path)

    fig = mlab.figure(figure="pointcloud",
                      size=(800, 600),
                      bgcolor=(0, 0, 0))
    mlab.clf(figure=None)

    color = pcd[:, 0]

    mlab.points3d(
        pcd[:, 0], pcd[:, 1], pcd[:, 2], color,
        color=pts_color, mode=pts_mode, colormap='rainbow',
        scale_factor=pts_scale, figure=fig
    )

    x_coords = [corner_pt[0] for corner_pt in corner_pts.values()]
    y_coords = [corner_pt[1] for corner_pt in corner_pts.values()]
    z_coords = [corner_pt[2] for corner_pt in corner_pts.values()]

    mlab.points3d(
        x_coords, y_coords, z_coords,
        color=(1, 0, 0), mode='sphere', scale_factor=0.2, figure=fig
    )

    for line_name in LINES_3D_PROVIDENTIA:
        start_point = corner_pts[line_name.split('/')[0]]
        end_point = corner_pts[line_name.split('/')[1]]
        line = [
            [start_point[0], end_point[0]],
            [start_point[1], end_point[1]],
            [start_point[2], end_point[2]]
        ]
        draw_3d_line(fig, line)

    # draw origin
    mlab.points3d(0, 0, 0, color=(1, 1, 1), mode='sphere', scale_factor=0.2)

    axes = np.array([
        [2.0, 0.0, 0.0, 0.0],
        [0.0, 2.0, 0.0, 0.0],
        [0.0, 0.0, 2.0, 0.0],
    ], dtype=np.float32)

    mlab.plot3d([0, axes[0, 0]], [0, axes[0, 1]], [0, axes[0, 2]], color=(1, 0, 0), tube_radius=None, figure=fig)
    mlab.plot3d([0, axes[1, 0]], [0, axes[1, 1]], [0, axes[1, 2]], color=(0, 1, 0), tube_radius=None, figure=fig)
    mlab.plot3d([0, axes[2, 0]], [0, axes[2, 1]], [0, axes[2, 2]], color=(0, 0, 1), tube_radius=None, figure=fig)

    mlab.view(azimuth=azimuth,
              elevation=elevation,
              focalpoint=[0, 0, 0],
              distance=distance,
              figure=fig)

    mlab.show()


def convert_pcd_to_bin(pcd_file):
    pcd = o3d.io.read_point_cloud(pcd_file)
    np_points = np.asarray(pcd.points)
    np_colors = np.asarray(pcd.colors)

    intensity = np.mean(np_colors, axis=1)

    np_cloud = np.hstack([np_points, intensity.reshape(-1, 1)])
    return np_cloud


def draw_2d_line(img, start_point, end_point, color):
    cv2.line(img, start_point, end_point, color, 3)


def draw_3d_line(fig, line):
    mlab.plot3d(
        line[0], line[1], line[2],
        color=(1, 0, 0), tube_radius=None, figure=fig
    )
    return fig

def clear_annotations(anno_dir):
    anno_list = sorted(glob.glob(os.path.join(anno_dir, '*.json')))

    for i, anno_file in enumerate(anno_list):
        with open(anno_file, 'r') as f:
            data = json.load(f)

        data['openlabel']['frames'][str(i)]['objects'] = {}

        with open(anno_file, 'w') as f:
            json.dump(data, f)

    print("Object annotations cleared successfully.")

def resize_image_by_factor(img_path, size_factor=0.5):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    width = int(img.shape[1] * size_factor)
    height = int(img.shape[0] * size_factor)
    dim = (width, height)
    resized = cv2.resize(img, dim, interpolation=cv2.INTER_AREA)
    cv2.imwrite(img_path, resized)


def resize_image_by_width_height(img_path, width=960, height=600):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    dim = (width, height)
    resized = cv2.resize(img, dim, interpolation=cv2.INTER_AREA)
    cv2.imwrite(img_path, resized)


def add_open3d_axis(vis):
    """Add a small 3D axis on Open3D Visualizer"""
    axis = o3d.geometry.LineSet()
    axis.points = o3d.utility.Vector3dVector(
        np.array([[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
    )
    axis.lines = o3d.utility.Vector2iVector(np.array([[0, 1], [0, 2], [0, 3]]))
    axis.colors = o3d.utility.Vector3dVector(
        np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
    )
    vis.add_geometry(axis)


def get_3d_boxes(data_path, timestamp):

    json_schema = os.path.join(data_path, 'annotations', timestamp + '.json')
    with open(json_schema, 'r') as f:
        anno_data = json.load(f)

    boxes = {
        "ids": [],
        "labels": []
    }

    for frame_id, frame_obj in anno_data["openlabel"]["frames"].items():
        for obj_id, label in frame_obj["objects"].items():
            boxes["ids"].append(obj_id)
            l = float(label['object_data']['cuboid']['val'][7])
            w = float(label['object_data']['cuboid']['val'][8])
            h = float(label['object_data']['cuboid']['val'][9])
            rotation_yaw = R.from_quat([label['object_data']['cuboid']['val'][3],
                                        label['object_data']['cuboid']['val'][4],
                                        label['object_data']['cuboid']['val'][5],
                                        label['object_data']['cuboid']['val'][6]]).as_euler("xyz", degrees=False)[2]
            position_3d = [
                float(label['object_data']['cuboid']['val'][0]),
                float(label['object_data']['cuboid']['val'][1]),
                float(label['object_data']['cuboid']['val'][2]),
            ]
            category = label["object_data"]["type"].upper()

            boxes["labels"].append([l, w, h, rotation_yaw, position_3d, category])

    return boxes


def get_corners(cuboid):
    """
    cuboid: list or array [xPos, yPos, zPos, quaternoins[x, y, z, w], l, w, h]
    """

    l = cuboid[7]
    w = cuboid[8]
    h = cuboid[9]

    bounding_box = np.array(
        [
            [-l/2, l/2, l/2, -l/2, -l/2, l/2, l/2, -l/2],
            [w/2, w/2, -w/2, -w/2, w/2, w/2, -w/2, -w/2],
            [-h/2, -h/2, -h/2, -h/2, h/2, h/2, h/2, h/2]
        ]
    )

    translation = cuboid[:3]
    # Repeat the [x, y, z] eight times
    eight_points = np.tile(translation, (8, 1))

    rotation_quaternion = cuboid[3:7]
    rotation_matrix = R.from_quat(rotation_quaternion).as_matrix()
    # Translate the rotated bounding box by the
    # original center position to obtain the final box
    corner_box = np.dot(rotation_matrix, bounding_box) + eight_points.transpose()

    return corner_box.transpose


def color_point_cloud(pcd):
    sorted_z = np.asarray(pcd.points)[np.argsort(np.asarray(pcd.points)[:, 2])[::-1]]
    rows = len(pcd.points)
    pcd.normalize_normals()
    # when Z values are negative, this if else statement switches the min and max
    if sorted_z[0][2] < sorted_z[rows - 1][2]:
        min_z_val = sorted_z[0][2]
        max_z_val = sorted_z[rows - 1][2]
    else:
        max_z_val = sorted_z[0][2]
        min_z_val = sorted_z[rows - 1][2]

    # assign colors to the point cloud file
    cmap_norm = mpl.colors.Normalize(vmin=min_z_val, vmax=max_z_val)
    # example color maps: jet, hsv.  Further colormaps: https://matplotlib.org/stable/tutorials/colors/colormaps.html
    point_colors = plt.get_cmap("jet")(cmap_norm(np.asarray(pcd.points)[:, -1]))[:, 0:3]
    pcd.colors = o3d.utility.Vector3dVector(point_colors)

    return pcd


def visualize_bounding_box(box_label, use_two_colors, input_type, vis):

    quats = R.from_euler("xyz", [0, 0, box_label[3]], degrees=False).as_quat()
    corners = get_corners(
        [
            box_label[4][0],
            box_label[4][1],
            box_label[4][2],
            quats[0],
            quats[1],
            quats[2],
            quats[3],
            box_label[0],
            box_label[1],
            box_label[2],
        ]
    )
    line_indices = [[0, 1], [1, 2], [2, 3], [0, 3], [4, 5], [5, 6], [6, 7], [4, 7], [0, 4], [1, 5], [2, 6], [3, 7]]

    if use_two_colors and input_type == "labels":
        # color_green_rgb = (27, 250, 27)
        color_green_rgb = (0, 0, 255)
        # color_green_normalized = (color_green_rgb[0] / 255, color_green_rgb[1] / 255, color_green_rgb[2] / 255)
        color_green_bgr_normalized = (color_green_rgb[2] / 255, color_green_rgb[1] / 255, color_green_rgb[0] / 255)
        colors = [color_green_bgr_normalized for _ in range(len(line_indices))]

    elif use_two_colors and input_type == "detections":
        color_red_rgb = (245, 44, 71)
        # color_red_rgb_normalized = (color_red_rgb[0] / 255, color_red_rgb[1] / 255, color_red_rgb[2] / 255)
        color_red_bgr_normalized = (color_red_rgb[2] / 255, color_red_rgb[1] / 255, color_red_rgb[0] / 255)
        colors = [color_red_bgr_normalized for _ in range(len(line_indices))]

    else:
        # change from rgb to bgr
        colors = [
            id_to_class_name_mapping[str(class_name_to_id_mapping[box_label[-1]])]["color_bgr_normalized"]
            for _ in range(len(line_indices))
        ]

    line_set = o3d.geometry.LineSet()

    line_set.points = o3d.utility.Vector3dVector(corners)
    line_set.lines = o3d.utility.Vector2iVector(line_indices)
    line_set.colors = o3d.utility.Vector3dVector(colors)

    vis.add_geometry(line_set)

    return line_set


def filter_point_cloud(pcd):
    points = np.array(pcd.points)
    points_filtered = points[~np.all(points == 0, axis=1)]

    # remove points with distance>120
    distances = np.array([np.sqrt(row[0] * row[0] + row[1] * row[1] + row[2] * row[2]) for row in points_filtered])
    points_filtered = points_filtered[distances < 120.0]
    distances = distances[distances < 120.0]
    # remove points with distance<3
    points_filtered = points_filtered[distances > 3.0]

    corner_point_min = np.array([-150, -150, -10])
    corner_point_max = np.array([150, 150, 5])
    points = np.vstack((points_filtered, corner_point_min, corner_point_max))

    pcd.points = o3d.utility.Vector3dVector(np.ascontiguousarray(points[:, :3]))

    return pcd


def create_annotations_video(data_path, video_name, fps, output_path):
    video = cv2.VideoWriter(os.path.join(output_path, video_name + '.avi'),
                            cv2.VideoWriter_fourcc(*'DIVX'), fps, (1024, 720))

    files = sorted(glob.glob(os.path.join(data_path, 'point_clouds', '*.pcd')))
    filenames = [i.split('.')[0].split('/')[-1] for i in files]

    for filename in filenames:
        pcd_path = os.path.join(data_path, 'point_clouds', filename + '.pcd')
        pcd = o3d.io.read_point_cloud(pcd_path)
        pcd = filter_point_cloud(pcd)

        pcd = color_point_cloud(pcd)

        vis = o3d.visualization.Visualizer()
        vis.create_window(window_name="Point Cloud Visualizer", width=1024, height=720)
        vis.get_render_option().background_color = [0.1, 0.1, 0.1]
        vis.get_render_option().point_size = 3.0

        vis.clear_geometries()
        add_open3d_axis(vis)
        vis.add_geometry(pcd)

        boxes = get_3d_boxes(data_path=data_path, timestamp=filename)
        for box_id, box_label in zip(boxes["ids"], boxes["labels"]):
            visualize_bounding_box(box_label=box_label,
                                   use_two_colors=False,
                                   input_type=None,
                                   vis=vis)

            vis.get_view_control().set_zoom(0.08)
            vis.get_view_control().set_front([-0.20, 0, 0])
            vis.get_view_control().set_lookat([27, 1, 8])
            vis.get_view_control().set_up([0, 0, 1])

            vis.capture_screen_image(filename=os.path.join(data_path, 'images', filename + '.png'),
                                     do_render=True)
            frame = cv2.imread(os.path.join(data_path, 'images', filename + '.png'))
            video.write(frame)
        video.release()


def resize_images(image_folder_paths):
    for image_folder_path in image_folder_paths:
            image_file_paths = sorted(glob.glob(os.path.join(image_folder_path, '*.jpg')))
            for image_file_path in image_file_paths:
                #resize_image_by_factor(image_file_path, size_factor=0.5)
                resize_image_by_width_height(image_file_path, width=960, height=600)




