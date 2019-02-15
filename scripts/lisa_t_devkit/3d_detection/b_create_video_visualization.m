clc;
clear;
close all;

%% 
addpath(genpath('MatlabAPI'));
addpath(genpath('cuboid'));
addpath(genpath('~/opt/mexopencv'));
root = '/mnt/cvrr-nas/WorkArea4/WorkArea4_Backedup/Datasets/Tesla/Data/setup5';
calibration_path = '/mnt/cvrr-nas/WorkArea3/WorkArea3_Backedup/Datasets/Tesla/Code/calibration-toolbox/parameters-16-May-2018';
drives = dir(root);
drives = {drives(3:end).name}';
camera_ids = {'front', 'front-right', 'rear-right', 'rear', 'rear-left', 'front-left'};
load(fullfile(calibration_path, 'intrinsics', [camera_ids{1}, '.mat']));
load('cam_to_lidar_transform.mat');
load('calibration.mat');

%%
thresh = 0.6;
use_opencv = 1;

%%
for drive = 1:length(drives)
    fprintf('\n-----------------------------------------\n');
    fprintf('Working on drive number %d/%d\n', drive, length(drives));
    fprintf('-----------------------------------------\n');
    if ~isdir(fullfile(root, drives{drive}, 'pprocessed')) ||...
            ~isdir(fullfile(root, drives{drive}, 'pprocessed', 'GPP')) ||...
            exist(fullfile(root, drives{drive}, 'pprocessed', 'GPP', 'gpp.json'), 'file') ~= 2 ||...
            exist(fullfile(root, drives{drive}, 'pprocessed', 'GPP', 'GPP.avi'), 'file') == 2
        continue
    end
    
    %%
    results_string = fileread(fullfile(root, drives{drive}, 'pprocessed', 'GPP', 'gpp.json'));
    results = gason(results_string);
    clear results_string;
    
    %%
    if use_opencv
        v = cv.VideoWriter(fullfile(root, drives{drive}, 'pprocessed', 'GPP', 'GPP.avi'), [2650, 960], 'FourCC','MJPG', 'FPS', 30, 'Color',true);
        vid_in = cell(length(camera_ids));
        for cam_id = 1:length(camera_ids)
            vid_in{cam_id} = cv.VideoCapture(fullfile(root, drives{drive},  [camera_ids{cam_id}, '.mp4']));
        end
    else
        v = VideoWriter(fullfile(root, drives{drive}, 'pprocessed', 'GPP', 'GPP.avi'));
        v.FrameRate = 30;
        open(v);
    end
    
    %%
    frames = cell(1, length(camera_ids));
    for count = 1:length(results)/6
        objects.camera = [];
        objects.scores = [];
        objects.residuals = [];
        objects.dimensions = [];
        objects.locations = [];
        objects.angles = [];
        objects.centers = {};
        objects.vertices = {};
        for cam_id = 1:length(camera_ids)
            if use_opencv
                frames{cam_id} = undistortImage(vid_in{cam_id}.read(), cameraParams);
            else
                vid_path = fullfile(root, drives{drive}, [camera_ids{cam_id}, '.mp4']);
                system(['python read_frame.py ', vid_path, ' ', num2str(count-1)]);
                frames{cam_id} = undistortImage(imread('~/.tmp/frame.png'), cameraParams);
            end
            boxes = reshape(results(6*(count-1)+cam_id).boxes, [], 4);
            keypoints = permute(reshape(results(6*(count-1)+cam_id).keypoints, [], 2, 4), [3, 2, 1]);
            labels = results(6*(count-1)+cam_id).labels;
            camera = results(6*(count-1)+cam_id).camera;
            scores = results(6*(count-1)+cam_id).scores;
            locations = reshape(results(6*(count-1)+cam_id).locations, [], 3);
            angles = reshape(results(6*(count-1)+cam_id).angles, [], 3);
            dimensions = reshape(results(6*(count-1)+cam_id).dimensions, [], 3);
            residuals = results(6*(count-1)+cam_id).residuals;
            boxes = [boxes(:, 1), boxes(:, 2), boxes(:, 3) - boxes(:, 1), boxes(:, 4) - boxes(:, 2)];
            
            idx = find(scores >= thresh & residuals <= 0.2);
            scores_str = arrayfun(@(x) sprintf('%.2f', x), scores, 'UniformOutput', false);
            scores = scores(idx);
            scores_str = scores_str(idx);
            camera = camera*ones(1, length(idx));
            boxes = boxes(idx, :);
            keypoints = keypoints(:, :, idx);
            
            objects.camera = [objects.camera; camera'];
            objects.scores = [objects.scores; scores'];
            objects.residuals = [objects.residuals; residuals(idx)'];
            objects.dimensions = [objects.dimensions; dimensions(idx, :)];
            objects.locations = [objects.locations; locations(idx, :)];
            objects.angles = [objects.angles; angles(idx, :)];
            
%             if ~isempty(scores_str)
%                 frames{cam_id} = insertObjectAnnotation(frames{cam_id}, 'Rectangle',...
%                     round(boxes), scores_str, 'color', [0, 255, 0], 'LineWidth', 5, 'FontSize', 10);
%                 
%                 for i = 1:length(scores_str)
%                     frames{cam_id} = insertMarker(frames{cam_id}, round(keypoints(:, :, i)),...
%                         'x', 'color', 'g', 'Size', 15);
%                 end
%             end
        end
        
        %%
        for j = 1:length(objects.scores)
            [vertices, ~, center, vertices_2d] = compute3DBox(objects, T, P0, j);
            vertices = [vertices(1, :); vertices(2, :); vertices(3, :)]';
            objects.vertices{end+1, 1} = vertices;
            objects.centers{end+1, 1} = center;
            
            frames{objects.camera(j)+1} = insert3DBox(frames{objects.camera(j)+1}, vertices_2d);
        end
        objects = nms(objects, 0.1);
        
        %%
        figure('rend','painters','pos', [1000 200 600 800]);
        hold on;
        faces = [1, 2, 3, 4;
            5, 6, 7, 8;
            1, 4, 8, 5;
            2, 3, 7, 6;
            1, 2, 6, 5;
            3, 4, 8, 7];
        for j = 1:length(objects.scores)
            patch('Vertices', objects.vertices{j}, 'Faces', faces, 'FaceColor', 'k',...
                'FaceAlpha', 0.2, 'EdgeColor', 'k');
            heading = objects.vertices{j}(1, :) - objects.vertices{j}(4, :);
            heading = heading/norm(heading);
            quiver3(objects.centers{j}(1), objects.centers{j}(2), objects.centers{j}(3), heading(1), heading(2), heading(3), 4,...
                'linewidth', 1.5, 'color', 'k', 'MaxHeadSize', 1);
        end
        axis([-40, 40, -60, 60, -40, 40]);
        set(gca,'FontSize', 14);
        grid on;
        set(gcf, 'Color', 'w');
        axes('pos', [0.48, 0.48, 0.07, 0.07]);
        [im, map, alpha] = imread('ego.png');
        f = imshow(im);
        set(f, 'AlphaData', alpha);
        hold off;
        bird_im = getframe(gcf);
        close;
        bird_im = bird_im.cdata;
        bird_im = imresize(bird_im, [960, 730]);
        
        %%
        im_out = [imresize(frames{6}, [480, 640]), imresize(frames{1}, [480, 640]),...
            imresize(frames{2}, [480, 640]); imresize(frames{5}, [480, 640]),...
            imresize(frames{4}, [480, 640]), imresize(frames{3}, [480, 640])];
        im_out = [im_out, bird_im];
        if use_opencv
            v.write(im_out);
        else
            writeVideo(v, im_out);
        end

%         figure()
%         imshow(im_out);
%         input('');
%         close;
        fprintf('Done with frame %d/%d...\n', count, length(results)/6);
    end
    if use_opencv
        v.release();
    else
        close(v);
    end
end
