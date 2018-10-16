#include <iostream>
#include <pcl/common/io.h>
#include <pcl/io/pcd_io.h>

using namespace std;


int main (int argc, char** argv)
{
  if (argc < 4)
  {
    std::cerr << "Syntax is: " << argv[0] << " <file_in.pcd> <file_out.pcd> 0/1/2 (ascii/binary/binary_compressed) [precision (ASCII)]" << std::endl;
    return (-1);
  }
  pcl::PCLPointCloud2 cloud;
  Eigen::Vector4f origin; Eigen::Quaternionf orientation;

  if (pcl::io::loadPCDFile (string (argv[1]), cloud, origin, orientation) < 0)
  {
    std::cerr << "Unable to load " << argv[1] << std::endl;
    return (-1);
  }else
  {
    std::cout << "file loaded" << std::endl;
  }
  int type = atoi (argv[3]);

  std::cerr << "Loaded a point cloud with " << cloud.width * cloud.height <<
               " points (total size is " << cloud.data.size () <<
               ") and the following channels: " << pcl::getFieldsList (cloud) << std::endl;

  pcl::PCDWriter w;
  if (type == 0)
  {
    std::cerr << "Saving file " << argv[2] << " as ASCII." << std::endl;
    w.writeASCII (string (argv[2]), cloud, origin, orientation, (argc == 5) ? atoi (argv[4]) : 7);
  }
  else if (type == 1)
  {
    std::cerr << "Saving file " << argv[2] << " as binary." << std::endl;
    w.writeBinary (string (argv[2]), cloud, origin, orientation);
  }
  else if (type == 2)
  {
    std::cerr << "Saving file " << argv[2] << " as binary_compressed." << std::endl;
    w.writeBinaryCompressed (string (argv[2]), cloud, origin, orientation);
  }
}

