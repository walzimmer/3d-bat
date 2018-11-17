from nuscenes_utils.nuscenes import NuScenes

nusc = NuScenes()
for (sensor, sd_token) in nusc.sample[0]['data'].items():
    cs_token = nusc.get('sample_data', sd_token)['calibrated_sensor_token']
    translation = nusc.get('calibrated_sensor', cs_token)['translation']
    print("%s %s" % (sensor, translation))
