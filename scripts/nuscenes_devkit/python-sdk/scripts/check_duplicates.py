# dupFinder.py
import os, sys
import hashlib


def findDup(parentFolder):
    # Dups in format {hash:[names]}
    dups = {}
    for dirName, subdirs, fileList in os.walk(parentFolder):
        print('Scanning %s...' % dirName)
        for filename in fileList:
            # Get the path to the file
            path = os.path.join(dirName, filename)
            # Calculate hash
            file_hash = hashfile(path)
            # Add or append the file path
            if file_hash in dups:
                dups[file_hash].append(path)
            else:
                dups[file_hash] = [path]
    return dups


# Joins two dictionaries
def joinDicts(dict1, dict2):
    for key in dict2.keys():
        if key in dict1:
            dict1[key] = dict1[key] + dict2[key]
        else:
            dict1[key] = dict2[key]


def hashfile(path, blocksize=65536):
    afile = open(path, 'rb')
    hasher = hashlib.md5()
    buf = afile.read(blocksize)
    while len(buf) > 0:
        hasher.update(buf)
        buf = afile.read(blocksize)
    afile.close()
    return hasher.hexdigest()


def printResults(dict1):
    results = list(filter(lambda x: len(x) > 1, dict1.values()))
    if len(results) > 0:
        print('Duplicates Found:')
        print('The following files are identical. The name could differ, but the content is identical')
        print('___________________')
        for result in results:
            for subresult in result:
                print('\t\t%s' % subresult)
            print('___________________')

    else:
        print('No duplicate files found.')


if __name__ == '__main__':
    dups = {}
    # folders = sys.argv[1:]
    folders = ['/home/cvrr/Downloads/samples/CAM_BACK_LEFT/',
               '/home/cvrr/Downloads/samples/CAM_BACK_RIGHT/',
               '/home/cvrr/Downloads/samples/CAM_BACK/',
               '/home/cvrr/Downloads/samples/CAM_FRONT_LEFT/',
               '/home/cvrr/Downloads/samples/CAM_FRONT_RIGHT/',
               '/home/cvrr/Downloads/samples/CAM_FRONT/']
    for i in folders:
        # Iterate the folders given
        if os.path.exists(i):
            # Find the duplicated files and append them to the dups
            joinDicts(dups, findDup(i))
        else:
            print('%s is not a valid path, please verify' % i)
            sys.exit()
    printResults(dups)
