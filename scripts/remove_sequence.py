import os

input_path_annotations = "../input/providentia/2021_01_24_10_s50_s_cam_near/annotations/"
input_path_images = "../input/providentia/2021_01_24_10_s50_s_cam_near/images/"

for filename_annotation, filename_image in zip(os.listdir(input_path_annotations),os.listdir(input_path_images)):
    annotation_parts = filename_annotation.split('.')[0].split('_')
    filename_annotation_new = '_'.join(annotation_parts[0:8])+'_'+ '_'.join(annotation_parts[9:11])
    os.rename(input_path_annotations+filename_annotation,input_path_annotations+filename_annotation_new+'.json')

    image_parts = filename_image.split('.')[0].split('_')
    filename_image_new = '_'.join(image_parts[0:8])+ '_' +'_'.join(image_parts[9:11])
    os.rename(input_path_images+filename_image,input_path_images+filename_image_new+'.jpg')