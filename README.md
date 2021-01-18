<p align="center" width="100%">
    <img width="33%" src="https://github.com/walzimmer/bat-3d/blob/master/assets/img/3d-bat-icon.png"> 
</p>

# 3D Bounding Box Annotation Tool (3D BAT)
![3D Bounding Box Annotation Tool](https://github.com/walzimmer/bat-3d/blob/master/assets/img/3d_boxes.png)

# Installation
1. Clone repository: `git clone https://github.com/walzimmer/bat-3d.git`
2. Install npm 
   + Linux: `sudo apt-get install npm`
   + Windows: https://nodejs.org/dist/v10.15.0/node-v10.15.0-x86.msi
3. Install PHP Storm or WebStorm (IDE with integrated web server): https://www.jetbrains.com/phpstorm/download/download-thanks.html
4. [OPTIONAL] Install WhatPulse to measure the number of clicks and key strokes while labeling: https://whatpulse.org/
5. Open folder `bat-3d` in PHP Storm.
5. Move into directory: `cd bat-3d`.
6. Download sample scenes extracted from the NuScenes dataset from [here](https://github.com/walzimmer/bat-3d/releases/download/v0.1.0/NuScenes.zip) and extract the content into the `bat-3d/input/` folder.
7. Install required packages: `npm install`
8. Open `index.html` with chromium-browser (Linux) or Chrome (Windows) within the IDE. Right click on index.html -> Open in Browser -> Chrome/Chromium

# Overview
![Overview](https://github.com/walzimmer/bat-3d/blob/master/assets/img/overview.png)

# Paper
![Paper](https://github.com/walzimmer/bat-3d/blob/master/assets/img/paper.png)
Reference: https://arxiv.org/abs/1905.00525

# Animation
![Animation](https://github.com/walzimmer/bat-3d/blob/master/assets/img/animation.gif)

# Video
![Video](https://github.com/walzimmer/bat-3d/blob/master/assets/img/video.png)
Link: https://www.youtube.com/watch?v=gSGG4Lw8BSU

# Annotate your own data (point cloud and image or point cloud only)
To annotate your own data, follow this steps:
1. Create a new folder under the input folder (e.g. `bat-3d/input/waymo`)
2. For each annotation sequence create a separate folder e.g.

`input/waymo/20210103_waymo`

`input/waymo/20210104_waymo`

3. Under each sequence create the following folders:

`input/waymo/20210103_waymo/annotations` (this folder will contain the downloaded annotations)

`input/waymo/20210103_waymo/pointclouds` (place your point cloud scans (in `.pcd` ascii format) here)

`input/waymo/20210103_waymo/pointclouds_without_ground` (optional: Remove the ground using the `scripts/nuscenes_devkit/python-sdk/scripts/export_pointcloud_without_ground_nuscenes.py` script to use the checkbox "Filter ground". Change the threshold of -1.7 to the height of the LiDAR sensor.)

`input/waymo/20210103_waymo/images` (optional: For each camera image, create a folder: e.g. `CAM_BACK`, `CAM_BACK_LEFT`, `CAM_BACK_RIGHT`, `CAM_FRONT`, `CAM_FRONT_LEFT`, `CAM_FRONT_RIGHT`)

Make sure, that the LiDAR scan file names follow this naming format `000000.pcd, 000001.pcd, 000002.pcd` and so on. Same for image file names: `000000.png, 000001.png, 000002.png`) and the annotation file names: `000000.json, 000001.json, 000002.json`).

4. When annotating only point cloud data, make sure to set this variable to `true` in `js/base_label_tool.js`:

`pointCloudOnlyAnnotation: true` 

5. Open the annotation tool in you web browser and change the dataset from NuScenes to your own dataset (e.g. waymo) in the drop down field.



# 3D Bounding Box Labelling Instructions
1. Watch raw video (10 sec) to get familiar with the sequence and to see where interpolation makes sense
2. Watch tutorial videos to get familiar with (translation/scaling/rotating objects, interpolation and how to use helper views)
3. Start WhatPulse. Login with koyunujiju@braun4email.com and password: labeluser
4. Draw bounding box in the Bird's-Eye-View (BEV)
5. Move/Scale it in BEV using 3D arrows (drag and drop) or sliders
6. Choose one of the 5 classes (Car, Pedestrian, Cyclist, Motorbike, Truck)
7. Interpolate if necessary
   1. Select Object to interpolate by clicking on a Bounding Box
   2. Activate 'Interpolation Mode' in the menu (checkbox) -> start position will be saved
   3. Move to desired frame by skipping x frames
   4. Translate object to new position
   5. Click on the 'Interpolate' button in the menu
8. Repeat steps 4-7 for all objects in the sequence
9. Download labels to your computer (JSON file)
10. Stop the time after labeling is done.
11. Make screenshots of keyboard and mouse heat map, record number of clicks and keystrokes


# Keyboard Shortcuts
| Key | Description   | |
| --- | ------------- |---|
|  ![V](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/c.png)  | Toggle view (3D view/Bird's-Eye-View)||
|     |  ![W](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/w.png)  | Move forward in 3D view (TODO)|
|     |  ![A](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/a.png)  | Move left in 3D view (TODO)|
|     |  ![S](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/s.png)  | Move backward in 3D view (TODO)|
|     |  ![D](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/d.png)  | Move right in 3D view (TODO)|
|     |  ![Q](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/q.png)  | Move down in 3D view (TODO)|
|     |  ![E](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/e.png)  | Move up in 3D view (TODO)|
|  ![C](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/c.png)  | Enlarge camera image||
|  ![N](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/n.png)  | Next frame     ||
|  ![P](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/p.png)  | Previous frame   ||
|  ![I](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/i.png)  | Interpolate    ||
|  ![CTRL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/ctrl.png)![MOUSELEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/mouseleft.png) | Snap to grid in 0.5m steps (floor alignment mode)  ||
|  ![T](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/t.png)  | Enable/Disable Translation mode||
|     |  ![W](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/w.png)  | Move selected object forward (TODO)|
|     |  ![A](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/a.png)  | Move selected object to left (TODO)|
|     |  ![S](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/s.png)  | Move selected object backward (TODO)|
|     |  ![D](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/d.png)  | Move selected object to right (TODO)|
|     |  ![Q](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/q.png)  | Move selected object down (TODO)|
|     |  ![E](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/e.png)  | Move selected object up (TODO)|
|  ![R](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/r.png)  | Enable/Disable Rotation mode||
|     |  ![LEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/left.png) | Rotate selected object counter-clock-wise (TODO)|
|     |  ![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png)  | Rotate selected object clock-wise (TODO)|
|  ![Y](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/y.png)  | Enable/Disable Scaling mode ||
|     | ![UP](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/up.png) | Increase length along longitudinal axis (y-axis) (TODO)|
|     | ![DOWN](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/down.png) | Decrease length along longitudinal axis (y-axis) (TODO)|
|     | ![LEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/left.png)  | Decrease width along lateral axis (x-axis) (TODO)|
|     | ![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png)  | Increase width along lateral axis (x-axis) (TODO)|
|     | ![SHIFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/shift.png)![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png)  | Increase height along vertical axis (z-axis) (TODO)|
|     | ![CTRL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/ctrl.png)![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png) | Decrease height along vertical axis (z-axis) (TODO)|
|  ![PLUS](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/plus.png)  | Increase arrow size ||
|  ![MINUS](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/minus.png)  | Decrease arrow size ||
|  ![X](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/x.png)  | Show/Hide X-axis ||
|  ![Y](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/y.png)  | Show/Hide Y-axis ||
|  ![Z](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/z.png)  | Show/Hide Z-axis (only in 3D mode)||
|  ![SPACE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/space.png)  | Switch between different operation modes (translate, rotate, scale) (TODO) ||
|  ![TAB](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/tab.png)  | Select next object (TODO)||
| ![DEL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/del.png) OR ![BACKSPACE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/backspace.png) | Delete selected object (TODO)||
|  ![M](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/m.png)  | Marking mode (TODO)||
|     | ![LEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/left.png) | Move orientation of object counter-clock-wise (TODO)|
|     | ![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png)| Move orientation of object clock-wise (TODO)|
|  ![ONE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/1.png)  | Select class CAR (TODO)||
|  ![TWO](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/2.png)  | Select class Truck (TODO)||
|  ![THREE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/3.png)  | Select class Motorcycle (TODO)||
|  ![FOUR](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/4.png)  | Select class Bicycle (TODO)||  
|  ![FIVE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/5.png)  | Select class Pedestrian (TODO)||
| ![MOUSELEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/mouseleft.png) | On a 2D/3D object: Show bounding box||
|            | On a camera image: Enlarge/Shrink camera image (TODO)||
|            | On ego vehicle: Show field-of-view (TODO)||
|            | ![LEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/left.png)![RIGHT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/right.png): Switch FOV to next channel||
| ![R](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/r.png)| Reset all selected bounding boxes (TODO)||
| ![F11](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/f11.png) | Full Screen Mode||
| ![P](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/p.png) | Play video (TODO)||
| ![K](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/k.png) | Keyboard navigation (only in 3D view) (TODO)||
| ![L](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/l.png) | Toggle Lighting (TODO)||
| ![L](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/l.png)![ONE](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/1.png) | Label random color (TODO)||
| ![L](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/l.png)![TWO](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/2.png) | Label class color (TODO)||
| ![T](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/t.png) | Show/Hide trajectory (TODO)||
| ![SHIFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/shift.png)![S](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/s.png)| Save current screen into file (requires request to server) (TODO)||
| ![SHIFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/shift.png)![D](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/d.png)| Download annotation file (TODO)||
| ![CTRL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/ctrl.png)![Z](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/z.png)| Undo operation (TODO)||
| ![CTRL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/ctrl.png)![Y](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/y.png)| Redo operation (TODO)||
| ![CTRL](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/ctrl.png)![W](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/w.png)| Close tab (exit)||
| ![G](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/g.png) | Show/Hide grid (TODO)||
| ![H](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/h.png) | Toggle aggregated pointcloud (TODO)||
| ![J](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/j.png) | Hide all labels except selected object (Press again to show all labels) (TODO)||
| ![QUESTIONMARK](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/questionmark.png) | Show keyboard shortcuts||
| ![ESC](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/esc.png) | Unselect box (TODO)||
|                                                                                                                               | Quit fullscreen cam image (TODO)||
| ![ALT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/alt.png)![MOUSELEFT](https://github.com/walzimmer/bat-3d/blob/master/assets/textures/keyboard_small/mouseleft.png) | Copy bounding box (by dragging) (TODO)||

Hints:
+ Select `Copy label to next frame` checkbox if you want to keep the label (position, size, class) for next frame
+ Use helper views to align object along z-axis (no need to switch into 3D view)
+ Label one object from start to end (using interpolation) and then continue with next object
+ **Do not** apply more than one box to a single object.
+ Check every cuboid in every frame, to make sure all points are inside the cuboid and **look reasonable in the image view**.
+ The program has been quite stable in my use cases, but there is no guarantee that it won't crash. So please back up (download) your annotated scenes (~every 10 min). Saving to local storage (browser) is done automatically.
+ Download the annotation file into the following folder: `bat-3d/input/<DATASET>/<SEQUENCE>/annotations`
+ Please open new issue tickets on Github for questions and bug reports or write me an email (wzimmer@eng.ucsd.edu). Thanks!

# Special Rules
+ **Minimum LIDAR Points** :
    + Label any target object containing **at least 10 LIDAR points**, as long as you can be reasonably sure you know the location and shape of the object. Use your best judgment on correct cuboid position, sizing, and heading.
+ **Cuboid Sizing** :
    + **Cuboids must be very tight.** Draw the cuboid as close as possible to the edge of the object without excluding any LIDAR points. There should be almost no visible space between the cuboid border and the closest point on the object.
+ **Extremities** :
    + **If** an object has extremities (eg. arms and legs of pedestrians), **then** the bounding box should include the extremities.
    + **Exception**: Do not include vehicle side view mirrors. Also, do not include other vehicle extremities (crane arms etc.) that are above 1.5 meters high.
+ **Carried Object** :
    + If a pedestrian is carrying an object (bag, umbrella, tools etc.), such objects will be included in the bounding box for the pedestrian. If two or more pedestrians are carrying the same object, the bounding box of only one of them will include the object.
+ **Use Images when Necessary**:
    + For objects with few LIDAR points, use the images to make sure boxes are correctly sized. If you see that a cuboid is too short in the image view, adjust it to cover the entire object based on the image view.

# Labels
**For every bounding box, include one of the following labels:**
1. **[Car](#car)**: Vehicle designed primarily for personal use, e.g. sedans, hatch-backs, wagons, vans, mini-vans, SUVs, jeeps and pickup trucks (a pickup truck is a light duty truck with an enclosed cab and an open or closed cargo area; a pickup truck can be intended primarily for hauling cargo or for personal use).   

2. **[Truck](#truck)**: Vehicles primarily designed to haul cargo including lorrys, trucks.

3. **[Motorcycle](#motorcycle)**: Gasoline or electric powered 2-wheeled vehicle designed to move rapidly (at the speed of standard cars) on the road surface. This category includes all motorcycles, vespas and scooters. It also includes light 3-wheel vehicles, often with a light plastic roof and open on the sides, that tend to be common in Asia (rickshaws). If there is a rider and/or passenger, include them in the box.

4. **[Bicycle](#bicycle)**: Human or electric powered 2-wheeled vehicle designed to travel at lower speeds either on road surface, sidewalks or bicycle paths. If there is a rider and/or passenger, include them in the box.

5. **[Pedestrian](#pedestrian)**: An adult/child pedestrian moving around the cityscape. Mannequins should also be annotated as `Pedestrian`.  

 # Detailed Instructions and Examples

Bounding Box color convention in example images:
 + **Green**: Objects like this should be annotated


## Car
+ Vehicle designed primarily for personal use, e.g. sedans, hatch-backs, wagons, vans, mini-vans, SUVs and jeeps.   
    + If it is primarily designed to haul cargo it is a truck.

    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/personal_vehicle_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/personal_vehicle_4.jpg)

## Truck
+ Vehicles primarily designed to haul cargo including lorrys, trucks, pickup truck (a pickup truck is a light duty truck with an enclosed cab and an open or closed cargo area; a pickup truck can be intended primarily for hauling cargo or for personal use).

    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/truck_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/truck_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/truck_4.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/truck_5.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/pickup_truck_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/pickup_truck_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/pickup_truck_4.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/pickup_truck_5.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_2.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_3.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_5.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_6.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_7.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/front_of_semi_truck_8.png)

 ## Motorcycle
+ Gasoline or electric powered 2-wheeled vehicle designed to move rapidly (at the speed of standard cars) on the road surface. This category includes all motorcycles, vespas and scooters. It also includes light 3-wheel vehicles, often with a light plastic roof and open on the sides, that tend to be common in Asia (rickshaws).
    + If there is a rider, include the rider in the box.
    + If there is a passenger, include the passenger in the box.
    + If there is a pedestrian standing next to the motorcycle, do NOT include in the annotation.

    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_1.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_4.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_5.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_6.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_7.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/motorcycle_8.jpg)

## Bicycle
+ Human or electric powered 2-wheeled vehicle designed to travel at lower speeds either on road surface, sidewalks or bicycle paths.
    + If there is a rider, include the rider in the box
    + If there is a passenger, include the passenger in the box
    + If there is a pedestrian standing next to the bicycle, do NOT include in the annotation

    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/bicycle_1.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/bicycle_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/bicycle_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/bicycle_4.jpg)


## Pedestrian
+ An adult/child pedestrian moving around the cityscape.
    + Mannequins should also be treated as pedestrian.

    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/mannequin_1.png)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/adult_pedestrian_2.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/adult_pedestrian_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/adult_pedestrian_4.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/adult_pedestrian_5.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/child_pedestrian_1.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/child_pedestrian_3.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/child_pedestrian_4.jpg)
    ![](https://www.nuscenes.org/public/images/taxonomy_imgs/child_pedestrian_5.jpg)

# License

Copyright © 2019 The Regents of the University of California

All Rights Reserved. Permission to copy, modify, and distribute this tool for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice, this paragraph and the following three paragraphs appear in all copies. Permission to make commercial use of this software may be obtained by contacting:


Office of Innovation and Commercialization  
9500 Gilman Drive, Mail Code 0910  
University of California  
La Jolla, CA 92093-0910  
(858) 534-5815  
innovation@ucsd.edu  


This tool is copyrighted by The Regents of the University of California. The code is supplied “as is”, without any accompanying services from The Regents. The Regents does not warrant that the operation of the tool will be uninterrupted or error-free. The end-user understands that the tool was developed for research purposes and is advised not to rely exclusively on the tool for any reason.


IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF THE USE OF THIS TOOL, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE TOOL PROVIDED HEREUNDER IS ON AN “AS IS” BASIS, AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.
