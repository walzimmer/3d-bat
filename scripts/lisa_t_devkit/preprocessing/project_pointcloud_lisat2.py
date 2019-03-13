import json

import cv2
import numpy as np
import webcolors

if __name__ == '__main__':
    # 2D points were calculated and exported in matlab
    root_path = '/media/cvrr/data/sandbox/3D_BoundingBox_Annotation_Tool_3D_BAT/input/LISA_T/2018-05-23-001-frame-00042917-00043816/'
    points_path = root_path + 'pointclouds/'
    cam_channels = ['CAM_FRONT_LEFT', 'CAM_FRONT_orig', 'CAM_FRONT_RIGHT', 'CAM_BACK_RIGHT', 'CAM_BACK_orig',
                    'CAM_BACK_LEFT']
    color_map_path = 'color_map.js'
    # annotations_path = 'LISA_T_2018-05-23-001-frame-00042917-00043816_annotations_groundtruth.txt'
    annotations_path = 'LISA_T_2018-05-23-001-frame-00042917-00043816_annotations.txt'
    image_panel_height = 240

    projection_matrix_lisa_uni = np.array([[851.809297551590, 0, 981.172134933419, 0],
                                           [0, 849.762831114839, 692.173655689540, 0],
                                           [0, 0, 1, 0]])
    transformation_matrices = []
    transformation_matrices.append(np.array([[0.6119, 0.791, -0.0001, -0.9675],
                                             [0.0757, -0.0587, -0.9954, -1.8214],
                                             [-0.7873, 0.6091, -0.0958, -82.9684],
                                             [0, 0, 0, 1]]))
    transformation_matrices.append(np.array([[9.97200e-01, -9.40000e-03, 7.40000e-02, -7.71510e+00],
                                             [-7.34000e-02, 5.00000e-02, 9.96000e-01, 1.34829e+01],
                                             [-1.30000e-02, -9.98700e-01, 4.92000e-02, 5.97093e+01],
                                             [0, 0, 0, 1]]))
    transformation_matrices.append(np.array([[4.89900e-01, -8.70800e-01, 4.07000e-02, 9.85610e+00],
                                             [-4.84000e-02, -7.39000e-02, -9.96100e-01, -2.67600e+00],
                                             [8.70400e-01, 4.86100e-01, -7.85000e-02, -6.86021e+01],
                                             [0, 0, 0, 1]]))
    transformation_matrices.append(np.array([[-0.1932, -0.9775, -0.0856, -81.1507],
                                             [-0.09, 0.1046, -0.9904, -2.2588],
                                             [0.977, -0.1837, -0.1082, -60.6184],
                                             [0, 0, 0, 1]]))
    transformation_matrices.append(np.array([[-0.9988, 0.0439, 0.0189, -2.0743],
                                             [-0.0149, 0.0895, -0.9959, -95.8045],
                                             [-0.0455, -0.995, -0.0888, -4.2963],
                                             [0, 0, 0, 1]]))
    transformation_matrices.append(np.array([[-0.0664, 0.995, 0.0742, 71.5185],
                                             [0.0397, 0.0769, -0.9962, 1.0001],
                                             [-0.997, -0.0632, -0.0446, -84.9344],
                                             [0, 0, 0, 1]]))
    intrinsic_matrix_uni = np.array([[851.809297551590, 0, 981.172134933419, 0],
                                     [0, 849.762831114839, 692.173655689540, 0],
                                     [0, 0, 1, 0]])

    projection_matrices = []
    # front left
    projection_matrices.append(
        np.array([[-251.25471266126286, 1271.4131017512532, -94.08147145637669, -82230.40765539104],
                  [-480.6212728089816, 371.7218954940578, -912.1641583067685, -58976.298755304604],
                  [-0.7873, 0.6091, -0.0958, -82.9684]]))
    # front
    projection_matrices.append(
        np.array([[922.0309695035186, 914.7246439533986, 37.20014817055355, -62468.44587897763],
                  [43.23307990854648, 731.8931026225239, -814.6031955744643, -50887.53498424891],
                  [0.074, 0.996, 0.0492, -60.7137]]))
    # front right
    projection_matrices.append(
        np.array(
            [[1271.3136011165718, -264.8077615167896, -42.35337418192368, -58914.95130031767],
             [561.3394288862174, 273.6681408112988, -900.78438804512, -49758.5316810427],
             [0.8704, 0.4861, -0.0785, -68.6021]]
        ))
    # back right
    projection_matrices.append(
        np.array([[794.0356195429831, -1012.8849095439483, -179.07770087021203, -128602.00570706779],
                  [599.7750068083451, -38.26710841555636, -916.4982974817447, -43877.90381297301],
                  [0.977, -0.1837, -0.1082, -60.6184]]))
    # back
    # projection_matrices.append(
    #     np.array([[-895.4304585339987, -938.871846096237, -71.02888985836256, -5982.317869225711],
    #               [-44.155367517485175, -612.6590140263143, -907.7438241324993, -84384.88883048057],
    #               [-0.0455, -0.995, -0.0888, -4.2963]]))
    projection_matrices.append(
        np.array([[-895.4304585339987, -938.871846096237, -71.02888985836256, -97660.33408629964],
                  [-44.155367517485175, -612.6590140263143, -907.7438241324993, -68076.01403709005],
                  [-0.0455, -0.995, -0.0888, -95.8045]]))
    # back left
    projection_matrices.append(np.array(
        [[-1034.7887558860443, 785.54017213604, 19.44397266029749, -22415.14333034558],
         [-656.3615503272123, 21.601386673152174, -877.404677400356, -57939.50633439972],
         [-0.997, -0.0632, -0.0446, -84.9344]]
    ))

    # load color map
    color_map = []
    with open(color_map_path, 'r') as reader:
        color_map = reader.readlines()

    # load annotations
    annotations = []
    with open(annotations_path, 'r') as reader:
        annotations = json.load(reader)

    for channelIdx, channel in enumerate(cam_channels):
        image_in_path = root_path + 'images/' + channel + '/000000.jpg'
        with open(points_path + '000000.pcd') as file_reader:
            lines = file_reader.readlines()
            points3D = []
            for idx, line in enumerate(lines):
                if idx < 11:
                    continue
                pointsArray = line.rstrip().split(' ')
                points3D.append(np.array(
                    [float(pointsArray[0]) * 100, float(pointsArray[1]) * 100, float(pointsArray[2]) * 100, 1.0]))
            # project points
            img = cv2.imread(image_in_path)
            # crop front and back
            scaling_factor = 0
            if channelIdx == 1 or channelIdx == 4:
                img = img[0:960, 0:1920]
            scaling_factor = img.shape[0] / image_panel_height
            # resize image
            img_resized = cv2.resize(img, (int(img.shape[1] / scaling_factor), int(img.shape[0] / scaling_factor)), interpolation=cv2.INTER_AREA)

            points2D = []
            distances = []
            for i in range(len(points3D)):
                point3D = points3D[i]
                distance = np.sqrt((point3D[0] ** 2) + (point3D[1] ** 2) + (point3D[2] ** 2))
                # transform point from lidar to cam
                # point3D_transformed = np.dot(transformation_matrices[channelIdx], point3D.T)
                # point2D = np.dot(intrinsic_matrix_uni, point3D_transformed)
                point2D = np.dot(projection_matrices[channelIdx], point3D)
                point2D[0] = int(point2D[0] / point2D[2])
                point2D[1] = int(point2D[1] / point2D[2])
                if point2D[2] > 0:
                    points2D.append(point2D / scaling_factor)
                    distances.append(distance)
            max_distance = max(distances)
            for i in range(len(distances)):
                distances[i] = int(distances[i] * 255 / (max_distance - 5000))
            for point2D, distance in zip(points2D, distances):
                color = color_map[256 - int(distance)].rstrip().replace("\"", "")
                color_rgb = webcolors.hex_to_rgb(color)
                print(point2D[0], point2D[1])
                if point2D[0] > 0 and point2D[0] < 1920 and point2D[1] > 0 and point2D[1] < 1440:
                    # cv2.circle(img, (int(point2D[0]), int(point2D[1])), 4, color_rgb, thickness=-1)
                    cv2.circle(img_resized, (int(point2D[0]), int(point2D[1])), 4, color_rgb, thickness=-1)

            # draw 3d bb
            for box in annotations[0]:
                posx = float(box["x"]) * 100
                posy = float(box["y"]) * 100
                posz = float(box["z"]) * 100
                sizex = float(box["width"]) * 100
                # switch hight with length
                sizey = float(box["height"]) * 100
                sizez = float(box["length"]) * 100
                rotation = box["rotationY"]
                corner_points_3d = []
                # works for front
                # corner_points_3d.append(np.array([posx - sizex / 2, posy - sizey / 2, posz, 1]))
                # corner_points_3d.append(np.array([posx + sizex / 2, posy - sizey / 2, posz, 1]))
                # corner_points_3d.append(np.array([posx + sizex / 2, posy + sizey / 2, posz, 1]))
                # corner_points_3d.append(np.array([posx - sizex / 2, posy + sizey / 2, posz, 1]))
                # corner_points_3d.append(np.array([posx - sizex / 2, posy - sizey / 2, posz - sizez, 1]))
                # corner_points_3d.append(np.array([posx + sizex / 2, posy - sizey / 2, posz - sizez, 1]))
                # corner_points_3d.append(np.array([posx + sizex / 2, posy + sizey / 2, posz - sizez, 1]))
                # corner_points_3d.append(np.array([posx - sizex / 2, posy + sizey / 2, posz - sizez, 1]))

                # works for back
                corner_points_3d.append(np.array([posx - sizex / 2, posy - sizey / 2, posz + sizez / 2, 1]))
                corner_points_3d.append(np.array([posx + sizex / 2, posy - sizey / 2, posz + sizez / 2, 1]))
                corner_points_3d.append(np.array([posx + sizex / 2, posy + sizey / 2, posz + sizez / 2, 1]))
                corner_points_3d.append(np.array([posx - sizex / 2, posy + sizey / 2, posz + sizez / 2, 1]))
                corner_points_3d.append(np.array([posx - sizex / 2, posy - sizey / 2, posz - sizez / 2, 1]))
                corner_points_3d.append(np.array([posx + sizex / 2, posy - sizey / 2, posz - sizez / 2, 1]))
                corner_points_3d.append(np.array([posx + sizex / 2, posy + sizey / 2, posz - sizez / 2, 1]))
                corner_points_3d.append(np.array([posx - sizex / 2, posy + sizey / 2, posz - sizez / 2, 1]))

                # project all corner points
                corner_points_2d = []
                for corner_point_3d in corner_points_3d:
                    corner_point_2d = np.dot(projection_matrices[channelIdx], corner_point_3d.T)
                    corner_point_2d[0] = corner_point_2d[0] / corner_point_2d[2]
                    corner_point_2d[1] = corner_point_2d[1] / corner_point_2d[2]
                    if corner_point_2d[2] > 0:
                        corner_points_2d.append(corner_point_2d / scaling_factor)
                if len(corner_points_2d) == 8:
                    # top 4 lines
                    cv2.line(img_resized, (int(corner_points_2d[0][0]), int(corner_points_2d[0][1])),
                             (int(corner_points_2d[1][0]), int(corner_points_2d[1][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[1][0]), int(corner_points_2d[1][1])),
                             (int(corner_points_2d[2][0]), int(corner_points_2d[2][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[2][0]), int(corner_points_2d[2][1])),
                             (int(corner_points_2d[3][0]), int(corner_points_2d[3][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[3][0]), int(corner_points_2d[3][1])),
                             (int(corner_points_2d[0][0]), int(corner_points_2d[0][1])), color=(0, 255, 0), thickness=4)
                    # bottom 4 lines
                    cv2.line(img_resized, (int(corner_points_2d[4][0]), int(corner_points_2d[4][1])),
                             (int(corner_points_2d[5][0]), int(corner_points_2d[5][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[5][0]), int(corner_points_2d[5][1])),
                             (int(corner_points_2d[6][0]), int(corner_points_2d[6][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[6][0]), int(corner_points_2d[6][1])),
                             (int(corner_points_2d[7][0]), int(corner_points_2d[7][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[7][0]), int(corner_points_2d[7][1])),
                             (int(corner_points_2d[4][0]), int(corner_points_2d[4][1])), color=(0, 255, 0), thickness=4)
                    # side 4 lines
                    cv2.line(img_resized, (int(corner_points_2d[0][0]), int(corner_points_2d[0][1])),
                             (int(corner_points_2d[4][0]), int(corner_points_2d[4][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[1][0]), int(corner_points_2d[1][1])),
                             (int(corner_points_2d[5][0]), int(corner_points_2d[5][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[2][0]), int(corner_points_2d[2][1])),
                             (int(corner_points_2d[6][0]), int(corner_points_2d[6][1])), color=(0, 255, 0), thickness=4)
                    cv2.line(img_resized, (int(corner_points_2d[3][0]), int(corner_points_2d[3][1])),
                             (int(corner_points_2d[7][0]), int(corner_points_2d[7][1])), color=(0, 255, 0), thickness=4)
            # write image
            cv2.imwrite(channel + '_000000_projected.jpg', img_resized)
