function [corners_3D, impact_distance, box_center, corners_2D] = compute3DBox(objects, T, P, idx)

% compute rotational matrix
R = rodrigues(objects.angles(idx, :));

% 3D bounding box dimensions
l = objects.dimensions(idx, 3);
w = objects.dimensions(idx, 2);
h = objects.dimensions(idx, 1);

% 3D bounding box corners
x_corners = [l/2, l/2, -l/2, -l/2, l/2, l/2, -l/2, -l/2, 0];
y_corners = [0, 0, 0, 0, -h, -h, -h, -h, -h/2];
z_corners = [w/2, -w/2, -w/2, w/2, w/2, -w/2, -w/2, w/2, 0];

% rotate and translate 3D bounding box
corners_3D = R*[x_corners;y_corners;z_corners];
corners_3D(1,:) = corners_3D(1,:) + objects.locations(idx, 1);
corners_3D(2,:) = corners_3D(2,:) + objects.locations(idx, 2);
corners_3D(3,:) = corners_3D(3,:) + objects.locations(idx, 3);
corners_3D = [corners_3D; ones(1, size(corners_3D, 2))];

% get projected 2D corners in image
corners_2D = P*corners_3D;
corners_2D = corners_2D(1:2, :) ./ corners_2D(3, :);

% transform all 3D points to lidar coordinate frame
corners_3D = T{objects.camera(idx)+1}*corners_3D;
corners_3D = corners_3D(1:3, :) ./ corners_3D(4, :);

box_center = corners_3D(:, end);
corners_3D = corners_3D(:, 1:end-1);
corners_2D = corners_2D(:, 1:end-1);
impact_distance = min(sqrt(sum(corners_3D.^2, 1)));
end
