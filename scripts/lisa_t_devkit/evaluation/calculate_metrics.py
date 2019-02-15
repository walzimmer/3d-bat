import json
from bbox import BBox3D
from bbox.metrics import jaccard_index_3d
import matplotlib.pyplot as plt

import numpy as np

num_frames = 0


def calculate_metrics(dataset_name):
    users = []
    global num_frames
    if dataset_name == "LISA-T":
        users = ['akshay', 'nachiket', 'daniela']
        num_frames = 300
    elif dataset_name == 'NuScenes':
        users = ['akshay', 'nachiket', 'nasha']
        num_frames = 35
    else:
        print('dataset not supported')
        return

    metric_sequence_list = []
    iou_3d_sequence_list = []
    precision_sequence_list = []
    recall_sequence_list = []
    f1_score_sequence_list = []

    for user in users:
        if dataset_name == "LISA-T":
            annotations_file_gt = '/media/cvrr/data/documents/study/visiting_graduate_student/research/2_label_tool/statistics/LISA-T/LISA_T_2018-05-23-001-frame-00042917-00043816_small_annotations_walter.txt'
            annotations_file_akshay = '/media/cvrr/data/documents/study/visiting_graduate_student/research/2_label_tool/statistics/LISA-T/LISA_T_2018-05-23-001-frame-00042917-00043816_small_annotations_' + user + '.txt'
        elif dataset_name == 'NuScenes':
            annotations_file_gt = '/media/cvrr/data/documents/study/visiting_graduate_student/research/2_label_tool/statistics/NuScenes/NuScenes_ONE_annotations_walter.txt'
            annotations_file_akshay = '/media/cvrr/data/documents/study/visiting_graduate_student/research/2_label_tool/statistics/NuScenes/NuScenes_ONE_annotations_' + user + '.txt'
        else:
            print('dataset not supported')
            break

        with open(annotations_file_gt) as reader_gt:
            data_gt = json.load(reader_gt)

        with open(annotations_file_akshay) as reader_akshay:
            data_akshay = json.load(reader_akshay)

        iou_3d_frame_list = []
        frame_idx = 0
        recall_frame_list = []
        precision_frame_list = []
        f1_score_frame_list = []
        # iterate all gt frames and find for each bb highest 3D-IoU
        for objects_in_frame_gt, objects_in_frame_akshay in zip(data_gt, data_akshay):
            if frame_idx >= num_frames:
                break
            true_positives = 0
            false_negatives = 0
            false_positives = 0
            recall_frame = 0
            precision_frame = 0
            f1_score_frame = 0
            iou_3d_object_list = []
            # find true negatives and false positives
            for obj_user in objects_in_frame_akshay:
                box_user = BBox3D(obj_user["x"], obj_user["y"], obj_user["z"], obj_user["width"],
                                  obj_user["length"], obj_user["height"], rw=1, rx=0, ry=0,
                                  rz=obj_user["rotationY"])
                for obj_gt in objects_in_frame_gt:
                    box_gt = BBox3D(obj_gt["x"], obj_gt["y"], obj_gt["z"], obj_gt["width"], obj_gt["length"],
                                    obj_gt["height"],
                                    rw=1, rx=0, ry=0, rz=obj_gt["rotationY"])
                    iou_3d = jaccard_index_3d(box_gt, box_user)
                    if round(iou_3d, 2) == 0.00:
                        false_positives = false_positives + 1

            for obj_gt in objects_in_frame_gt:
                box_gt = BBox3D(obj_gt["x"], obj_gt["y"], obj_gt["z"], obj_gt["width"], obj_gt["length"],
                                obj_gt["height"],
                                rw=1, rx=0, ry=0, rz=obj_gt["rotationY"])
                iou_3d_highest_list = []
                for obj_akshay in objects_in_frame_akshay:
                    box_akshay = BBox3D(obj_akshay["x"], obj_akshay["y"], obj_akshay["z"], obj_akshay["width"],
                                        obj_akshay["length"], obj_akshay["height"], rw=1, rx=0, ry=0,
                                        rz=obj_akshay["rotationY"])
                    iou_3d = jaccard_index_3d(box_gt, box_akshay)
                    if iou_3d > 0.6:
                        iou_3d_highest_list.append(iou_3d)
                        true_positives = true_positives + 1
                    else:
                        # increase false_negatives
                        false_negatives = false_negatives + 1
                        iou_3d_highest_list.append(0)

                iou_3d_highest_list.sort(reverse=True)
                if len(iou_3d_highest_list) > 0:
                    iou_3d_object_list.append(iou_3d_highest_list[0])
                else:
                    iou_3d_object_list.append(0)

            if len(iou_3d_object_list) > 0:
                iou_3d_frame_average = sum(iou_3d_object_list) / len(iou_3d_object_list)
                iou_3d_frame_list.append(iou_3d_frame_average)
            else:
                iou_3d_frame_list.append(0)

            # recall for current frame
            if (true_positives + false_negatives) > 0:
                recall_frame = true_positives / (true_positives + false_negatives)
            recall_frame_list.append(recall_frame)
            print("recall frame " + str(frame_idx) + ":" + str(recall_frame))
            if (true_positives + false_positives) > 0:
                precision_frame = true_positives / (true_positives + false_positives)
            precision_frame_list.append(precision_frame)
            print("precision frame " + str(frame_idx) + ":" + str(precision_frame))
            if recall_frame > 0 and precision_frame > 0:
                f1_score_frame = 1 / (((1 / recall_frame) + (1 / precision_frame)) / 2)
            f1_score_frame_list.append(f1_score_frame)
            print("f1 score frame " + str(frame_idx) + ":" + str(f1_score_frame))
            frame_idx = frame_idx + 1

        recall_sequence = sum(recall_frame_list) / frame_idx
        print("recall sequence " + user + " :" + str(recall_sequence))
        precision_sequence = sum(precision_frame_list) / frame_idx
        print("precision sequence " + user + " :" + str(precision_sequence))
        f1_score_sequence = sum(f1_score_frame_list) / frame_idx
        print("f1 score sequence " + user + " :" + str(f1_score_sequence))

        if len(iou_3d_frame_list) > 0:
            lisa_sequence_iou_3d_akshay = sum(iou_3d_frame_list) / len(iou_3d_frame_list)
            print("3D-IoU " + user + " :" + str(lisa_sequence_iou_3d_akshay))
        else:
            print("3D-IoU: 0")

        iou_3d_sequence_list.append(iou_3d_frame_list)
        precision_sequence_list.append(precision_frame_list)
        recall_sequence_list.append(recall_frame_list)
        f1_score_sequence_list.append(f1_score_frame_list)

    metric_sequence_list.append(iou_3d_sequence_list)
    metric_sequence_list.append(precision_sequence_list)
    metric_sequence_list.append(recall_sequence_list)
    metric_sequence_list.append(f1_score_sequence_list)

    return metric_sequence_list


def plot_metric(metric_name, dataset_name, all_metrics_sequence_list):
    metric_sequence_list = []
    if metric_name == '3D-IoU':
        metric_sequence_list = all_metrics_sequence_list[0]
    elif metric_name == 'Precision':
        metric_sequence_list = all_metrics_sequence_list[1]
    elif metric_name == 'Recall':
        metric_sequence_list = all_metrics_sequence_list[2]
    elif metric_name == 'F1-score':
        metric_sequence_list = all_metrics_sequence_list[3]
    else:
        print("metric not supported.")
        return

    global num_frames
    # find max precision among all users
    max_metric_user2 = max(metric_sequence_list[0])
    max_metric_user3 = max(metric_sequence_list[1])
    max_metric_user4 = max(metric_sequence_list[2])
    max_metric_list = [max_metric_user2, max_metric_user3, max_metric_user4]
    plt.axis([1, num_frames, 0, max(max_metric_list)])
    plt.ylabel(metric_name)
    plt.xlabel('frame')
    plt.title(metric_name + ' on ' + str(dataset_name))
    x_values = np.asarray(np.arange(1, num_frames + 1, 1))
    y_values_user2 = np.asarray(metric_sequence_list[0])
    y_values_user3 = np.asarray(metric_sequence_list[1])
    y_values_user4 = np.asarray(metric_sequence_list[2])
    plt.plot(x_values, y_values_user2, '#EA4335', x_values, y_values_user3, '#34A853',
             x_values, y_values_user4, '#4285F4')
    plt.savefig(metric_name + '_' + dataset_name + '.png')
    plt.close()


# blue 4285F4 r:66,g:133,b:244
# red EA4335 r:234,g:67,b:53
# green 34A853 r:52, g: 168, b:83

def plot_curve(dataset_name, curve_name, precision_values, recall_values):
    # calculate average of all 3 users
    precision_values_avg = []
    for user_values in precision_values:
        precision_avg = (user_values[0]+user_values[1]+user_values[2])/3
        precision_values_avg.append(precision_avg)
    recall_values_avg = []
    for user_values in recall_values:
        recall_avg = (user_values[0] + user_values[1] + user_values[2]) / 3
        recall_values_avg.append(recall_avg)
    plt.axis([1, max(recall_values_avg), 0, max(precision_values_avg)])
    plt.ylabel('Precision')
    plt.xlabel('Recall')
    plt.title(curve_name + ' on ' + str(dataset_name))
    x_values = recall_values_avg
    y_values = precision_values_avg
    plt.plot(x_values, y_values, 'black')
    plt.savefig(curve_name + '_' + dataset_name + '.png')
    plt.close()


if __name__ == '__main__':
    # possible values dataset = ['LISA-T','NuScenes']
    metric_sequence_list = calculate_metrics('LISA-T')
    # possible values metric = ['3d-iou','precision','recall','f1-score']
    plot_metric('3D-IoU', 'LISA-T', metric_sequence_list)
    plot_metric('Precision', 'LISA-T', metric_sequence_list)
    plot_metric('Recall', 'LISA-T', metric_sequence_list)
    plot_metric('F1-score', 'LISA-T', metric_sequence_list)
    precision_values = metric_sequence_list[1]
    recall_values = metric_sequence_list[2]
    # possible values curve_name = ['PR-curve','ROC-curve']
    plot_curve('LISA-T', 'PR-curve', precision_values, recall_values)
    # plot_curve('LISA-T', 'ROC-curve', true_positive_rate, false_positive_rate)

    # NuScenes
    metric_sequence_list = calculate_metrics('NuScenes')
    plot_metric('3D-IoU', 'NuScenes', metric_sequence_list)
    plot_metric('Precision', 'NuScenes', metric_sequence_list)
    plot_metric('Recall', 'NuScenes', metric_sequence_list)
    plot_metric('F1-score', 'NuScenes', metric_sequence_list)
    precision_values = metric_sequence_list[1]
    recall_values = metric_sequence_list[2]
    plot_curve('NuScenes', 'PR-curve', precision_values, recall_values)
    # plot_curve('NuScenes', 'ROC-curve', true_positive_rate, false_positive_rate)
