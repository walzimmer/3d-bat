cmake_minimum_required(VERSION 2.6)
project(convert_binary_to_ascii)
find_package(PCL 1.8.1 REQUIRED COMPONENTS common io)
include_directories(${PCL_INCLUDE_DIRS})
link_directories(${PCL_LIBRARY_DIRS})
add_definitions(${PCL_DEFINITIONS})
add_executable(convert_binary_to_ascii convert_binary_to_ascii.cpp)
target_link_libraries(convert_binary_to_ascii ${PCL_COMMON_LIBRARIES}${PCL_IO_LIBRARIES})

