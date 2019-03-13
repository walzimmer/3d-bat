let labelTool = {
    datasets: Object.freeze({"NuScenes": "NuScenes", "LISA_T": "LISA_T"}),
    sequencesLISAT: Object.freeze({
        "date_2018_05_23_001_frame_00042917_00043816_small": "2018-05-23-001-frame-00042917-00043816_small",
        "date_2018_05_23_001_frame_00042917_00043816": "2018-05-23-001-frame-00042917-00043816",
        "date_2018_05_23_001_frame_00077323_00078222": "2018-05-23-001-frame-00077323-00078222",
        "date_2018_05_23_001_frame_00080020_00080919": "2018-05-23-001-frame-00080020-00080919",
        "date_2018_05_23_001_frame_00106993_00107892": "2018-05-23-001-frame-00106993-00107892",
        "date_2018_07_02_005_frame_00000000_00000900": "2018-07-02-005-frame-00000000-00000900",
        "date_2018_07_02_005_frame_00000900_00001800": "2018-07-02-005-frame-00000900-00001800",
        "date_2018_07_02_005_frame_00001800_00002700": "2018-07-02-005-frame-00001800-00002700"

    }),
    sequencesNuScenes: [],
    currentDataset: 'LISA_T',
    currentSequence: '2018-05-23-001-frame-00042917-00043816',//[2018-05-23-001-frame-00042917-00043816_small, One]
    // temprorarily set to 100
    numFramesLISAT: 50,
    numFramesNuScenes: 120,//[3962,120]
    frameScreenshots: [],
    numFrames: 0,
    dataTypes: [],
    playSequence: false,
    currentFileIndex: 0,
    showCameraPosition: true,
    previousFileIndex: 0,
    fileNames: [],
    takeCanvasScreenshot: false,
    timeDelay: 1000,
    pointCloudLoaded: false,
    imageCanvasInitialized: false,
    cameraImagesLoaded: false,
    timeDelayScreenshot: 2000,
    timeDelayPlay: 100,
    imageSizes: {},
    originalAnnotations: [],   // For checking modified or not
    skipFrameCount: 1,
    targetClass: "Vehicle",
    // pageBox: document.getElementById('page_num'),
    savedFrames: [],
    cubeArray: [],
    spriteArray: [],
    bboxIndexArray: [],
    currentCameraChannelIndex: 0,
    camChannels: [{
        channel: 'CAM_FRONT_LEFT',
        positionCameraNuScenes: [1.564, 0.472, 1.535],
        fieldOfView: 70,
        rotationY: 305 * Math.PI / 180,//305 degree
        projectionMatrixNuScenes: [[110.4698206116641, 1464.0011761439307, 26.41455707029287, -916.4598489300432],
            [-337.97741211920834, 265.1972065752412, -1252.6308707181809, -729.4327569362895],
            [-0.8143136873894475, 0.5803598650034878, 0.008697449242951868, -0.7728492390141875]],
        transformationMatrixEgoToCamNuScenes: [[8.09585281e-01, -5.86688274e-01, 1.91974424e-02, 1.56400000e+00],
            [2.33267982e-02, -5.23589075e-04, -9.99727756e-01, 4.72000000e-01],
            [5.86538603e-01, 8.09812692e-01, 1.32616689e-02, 1.53500000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        // projectionMatrixLISAT: [[-251.25471266126286, 1271.4131017512532, -94.08147145637669, -82230.40765539104],
        //     [-480.6212728089816, 371.7218954940578, -912.1641583067685, -58976.298755304604],
        //     [-0.7873, 0.6091, -0.0958, -82.9684]],
        projectionMatrixLISAT: [[-251.25471266126286, 1271.4131017512532, -94.08147145637669, -82230.40765539104],
            [-480.6212728089816, 371.7218954940578, -912.1641583067685, -58976.298755304604],
            [-0.7873, 0.6091, -0.0958, -82.9684]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // projectionMatrixLISAT: [[-215.2526681977112, 1310.3693441729433, -93.64018907169996, -81894.77674601768],
        //     [-491.1015539416495, 379.8210484742729, -980.7314142419619, -60737.10982639055],
        //     [-0.7873, 0.6091, -0.0958, -82.9684]],
        transformationMatrixEgoToCamLISAT: [[0.6119, 0.791, -0.0001, -0.9675],
            [0.0757, -0.0587, -0.9954, -1.8214],
            [-0.7873, 0.6091, -0.0958, -82.9684],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[0.611885708104161, 0.0757328996740149, -0.787314493117665, -0.645924850428946],
            [0.790958342977185, -0.0587080682108027, 0.609070023716074, -0.511902726095409],
            [-9.94618314704501e-05, -0.995431173227924, -0.0958096818561450, -0.0976217092625083],
            [0, 0, 0, 1]],
        rotation: 305
    }, {
        channel: 'CAM_FRONT',
        positionCameraNuScenes: [1.671, -0.026, 1.536],
        fieldOfView: 70,
        rotationY: 0, // 0 degree
        projectionMatrixNuScenes: [[1260.3593003446563, 790.4433526756009, 15.627522424805397, -636.3274027306582],
            [7.834243891370816, 448.30558439994263, -1259.159501002805, -740.8962245421313],
            [-0.003064512389859362, 0.9999620062762187, 0.008160561736325754, -0.7757948007768039]],
        transformationMatrixEgoToCamNuScenes: [[-0.0047123, -0.9999733, 0.00558502, 1.671],
            [0.01358668, -0.0056486, -0.99989174, -0.026],
            [0.99989659, -0.00463591, 0.01361294, 1.536],
            [0, 0, 0, 1,]],
        // old intrinsic
        // projectionMatrixLISAT: [[922.033620236691, 914.742127292118, 37.1306002570457, 52013.3448439892],
        //     [43.2552503707437, 731.907745080755, -814.641807656038, 52786.4684187814],
        //     [0.0739896518701493, 0.996046991878090, 0.0491520232212485, 59.7093249377266]],
        // tmp test with new translation vector
        // projectionMatrixLISAT: [[922.0309695035186, 914.7246439533986, 37.20014817055355, -13131.578714839563],
        //     [43.23307990854648, 731.8931026225239, -814.6031955744643, 44372.80515324952],
        //     [0.074, 0.996, 0.0492, -10.4301]],
        projectionMatrixLISAT: [[922.0309695035186, 914.7246439533986, 37.20014817055355, -62468.44587897763],
            [43.23307990854648, 731.8931026225239, -814.6031955744643, -50887.53498424891],
            [0.074, 0.996, 0.0492, -60.7137]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // new intrinsic
        // projectionMatrixLISAT: [[1032.0809269597441, 983.234693051346, 39.603066911575674, 55773.41899194405],
        //     [46.91969034275177, 800.4238080880446, -918.475825334129, 58018.158075382664],
        //     [0.074, 0.996, 0.0492, 59.7093]],
        transformationMatrixEgoToCamLISAT: [[9.97200e-01, -9.40000e-03, 7.40000e-02, -7.71510e+00],
            [-7.34000e-02, 5.00000e-02, 9.96000e-01, 1.34829e+01],
            [-1.30000e-02, -9.98700e-01, 4.92000e-02, 5.97093e+01],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[0.997215031568529, -0.00936548076240627, 0.0739896518701493, -0.0340200000000000],
            [-0.0734336035104482, 0.0499789540314553, 0.996046991878090, -0.607137000000000],
            [-0.0130263843505084, -0.998706359208757, 0.0491520232212485, -0.104301000000000],
            [0, 0, 0, 1]],
        rotation: 0
    }, {
        channel: 'CAM_FRONT_RIGHT',
        positionCameraNuScenes: [1.593, -0.527, 1.526],
        fieldOfView: 70,
        rotationY: 55 * Math.PI / 180, // 55 degree
        projectionMatrixNuScenes: [[1361.856983203004, -568.9937879652269, -6.653895294513566, -312.50854189580144],
            [335.73347658567, 262.5244187804859, -1260.4228451038455, -763.337941668381],
            [0.8064805242536375, 0.5911975331694409, 0.00863948921786484, -0.8346696345144945]],
        transformationMatrixEgoToCamNuScenes: [[-8.10859430e-01, -5.85025428e-01, -1.58818285e-02, 1.59300000e+00],
            [1.90058814e-02, 7.99720013e-04, -9.99819052e-01, -5.27000000e-01],
            [5.84932270e-01, -8.11014555e-01, 1.04704634e-02, 1.52600000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        // old intrinsic
        // projectionMatrixLISAT: [[1271.3136011165718, -264.8077615167896, -42.35337418192368, -58914.95130031767],
        //     [561.3394288862174, 273.6681408112988, -900.78438804512, -49758.5316810427],
        //     [0.8704, 0.4861, -0.0785, -68.6021]],
        projectionMatrixLISAT: [[1271.3136011165718, -264.8077615167896, -42.35337418192368, -58914.95130031767],
            [561.3394288862174, 273.6681408112988, -900.78438804512, -49758.5316810427],
            [0.8704, 0.4861, -0.0785, -68.6021]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // new intrinsic
        // projectionMatrixLISAT: [[1271.6922710846952, -304.99836406619386, -39.3907887583833, -57233.65791384971],
        //     [583.4133290049833, 284.0465837849785, -944.3857374439146, -51768.28201250383],
        //     [0.8704, 0.4861, -0.0785, -68.6021]],
        transformationMatrixEgoToCamLISAT: [[4.89900e-01, -8.70800e-01, 4.07000e-02, 9.85610e+00],
            [-4.84000e-02, -7.39000e-02, -9.96100e-01, -2.67600e+00],
            [8.70400e-01, 4.86100e-01, -7.85000e-02, -6.86021e+01],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[0.489949531751989, -0.0484410342339139, 0.870396411247678, 0.547505822207358],
            [-0.870796041221885, -0.0739463348124615, 0.486077585826712, -0.417296775245384],
            [0.0407426180835198, -0.996130722229845, -0.0784595299758922, -0.0845163336838742],
            [0, 0, 0, 1]],
        rotation: 55
    }, {
        channel: 'CAM_BACK_RIGHT',
        positionCameraNuScenes: [1.042, -0.456, 1.595],
        fieldOfView: 70,
        rotationY: 110 * Math.PI / 180, // 110 degree
        projectionMatrixNuScenes: [[268.5366860205932, -1442.5534066704236, -5.5654251139895745, 97.19498615315976],
            [406.6870884392414, -143.59988581953755, -1258.8039286060184, -475.31377943361736],
            [0.9377138162782094, -0.34740581495648687, 0.0014136814971854525, -0.37336636003724444]],
        transformationMatrixEgoToCamNuScenes: [[-9.34966822e-01, 3.54600502e-01, -9.77368820e-03, 1.04200000e+00],
            [9.88119913e-03, -1.50763065e-03, -9.99950043e-01, -4.56000000e-01],
            [-3.54597523e-01, -9.35016690e-01, -2.09429354e-03, 1.59500000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        // projectionMatrixLISAT: [[794.0356195429831, -1012.8849095439483, -179.07770087021203, -128602.00570706779],
        //     [599.7750068083451, -38.26710841555636, -916.4982974817447, -43877.90381297301],
        //     [0.977, -0.1837, -0.1082, -60.6184]],
        projectionMatrixLISAT: [[794.0356195429831, -1012.8849095439483, -179.07770087021203, -128602.00570706779],
            [599.7750068083451, -38.26710841555636, -916.4982974817447, -43877.90381297301],
            [0.977, -0.1837, -0.1082, -60.6184]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // projectionMatrixLISAT: [[848.5512598840686,-1129.2646483996264,-196.315756621337,-141734.32068581556],
        // [652.1020273778403,-38.71272862691212,-1029.46526109555,-47964.78590957537],
        // [0.977,-0.1837,-0.1082,-60.6184]],
        transformationMatrixEgoToCamLISAT: [[-0.1932, -0.9775, -0.0856, -81.1507],
            [-0.09, 0.1046, -0.9904, -2.2588],
            [0.977, -0.1837, -0.1082, -60.6184],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[-0.193231128863561, -0.0899745016110242, 0.977022225986264, 0.433415648129604],
            [-0.977461683106893, 0.104551287752388, -0.183698859473772, 0.902282239760038],
            [-0.0855534855862260, -0.990413220473740, -0.108171294514213, -0.157346593607020],
            [0, 0, 0, 1]],
        rotation: 110

    }, {
        channel: 'CAM_BACK',
        positionCameraNuScenes: [0.086, -0.007, 1.541],
        fieldOfView: 130,
        rotationY: Math.PI,//180 degree
        projectionMatrixNuScenes: [[-804.9366490955063, -670.8712520139895, -7.944554855775981, -532.4747992653032],
            [-2.598392799509179, -411.71700732441207, -802.0306250329542, -570.6743676244683],
            [-0.010095206737515048, -0.9999048082463075, -0.009405383928480443, -0.8092052225128153]],
        transformationMatrixEgoToCamNuScenes: [[1.78014178e-02, 9.99841527e-01, -1.74532924e-04, 8.60000000e-02],
            [1.48292972e-02, -4.38565732e-04, -9.99889944e-01, -7.00000000e-03],
            [-9.99731565e-01, 1.77968704e-02, -1.48347542e-02, 1.54100000e+00],
            [0.00000000e+00, 0.00000000e+00, 0.00000000e+00, 1.00000000e+00]],
        // projectionMatrixLISAT: [[-895.4304585339987, -938.871846096237, -71.02888985836256, -5982.317869225711],
        //     [-44.155367517485175, -612.6590140263143, -907.7438241324993, -84384.88883048057],
        //     [-0.0455, -0.995, -0.0888, -4.2963]],
        projectionMatrixLISAT: [[-895.4304585339987, -938.871846096237, -71.02888985836256, -97660.33408629964],
            [-44.155367517485175, -612.6590140263143, -907.7438241324993, -68076.01403709005],
            [-0.0455, -0.995, -0.0888, -95.8045]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // projectionMatrixLISAT: [[-986.505781537663,-883.3532006027316,-64.67265646137503,-93111.9226453282],
        // [-47.88317051477141,-651.6533925460091,-1014.0108621580484,-72925.35490935268],
        // [-0.0455,-0.995,-0.0888,-95.8045]],
        transformationMatrixEgoToCamLISAT: [[-0.9988, 0.0439, 0.0189, -2.0743],
            [-0.0149, 0.0895, -0.9959, -95.8045],
            [-0.0455, -0.995, -0.0888, -4.2963],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[-0.998808553877788, -0.0149413207580060, -0.0454503498176134, -0.0867564508770912],
            [0.0439474681814231, 0.0895085938805023, -0.995004795840449, 0.949494752014195],
            [0.0188751885024967, -0.995874825746460, -0.0888185338539377, -0.104974405626315],
            [0, 0, 0, 1]],
        rotation: 180
    }, {
        channel: 'CAM_BACK_LEFT',
        positionCameraNuScenes: [1.055, 0.441, 1.605],
        fieldOfView: 70,
        rotationY: 250 * Math.PI / 180, //250 degree
        projectionMatrixNuScenes: [[-1118.65453545052, 940.0229558602045, 5.20775624882033, -642.7023004564963],
            [-404.09996798165156, -139.683623818749, -1256.6685898616693, -457.3405152874417],
            [-0.943213201117988, -0.33216765461657427, 0.003675114050138092, -0.36297000058026163]],
        transformationMatrixEgoToCamNuScenes: [[0.94571775, 0.3248984, 0.00767937, 1.055],
            [0.00612855, 0.00579634, -0.99996442, 0.441],
            [-0.32493135, 0.94573116, 0.00349055, 1.605],
            [0, 0, 0, 1]],
        // old intrinsic
        // projectionMatrixLISAT: [[-1034.7887558860443, 785.54017213604, 19.44397266029749, -22415.14333034558],
        //     [-656.3615503272123, 21.601386673152174, -877.404677400356, -57939.50633439972],
        //     [-0.997, -0.0632, -0.0446, -84.9344]],
        projectionMatrixLISAT: [[-1034.7887558860443, 785.54017213604, 19.44397266029749, -22415.14333034558],
            [-656.3615503272123, 21.601386673152174, -877.404677400356, -57939.50633439972],
            [-0.997, -0.0632, -0.0446, -84.9344]],
        projectionMatrixLISATUni: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        intrinsicMatrixLISAT: [[851.809297551590, 0, 981.172134933419, 0],
            [0, 849.762831114839, 692.173655689540, 0],
            [0, 0, 1, 0]],
        // new intrinsic
        // projectionMatrixLISAT: [[-1017.8956117124864, 947.0278929555594, 32.58889806014775, -8586.028158741105],
        //     [-750.7556140821051, 27.649591167257046, -1043.054541250592, -66366.2238780424],
        //     [-0.997, -0.0632, -0.0446, -84.9344]],
        transformationMatrixEgoToCamLISAT: [[-0.0664, 0.995, 0.0742, 71.5185],
            [0.0397, 0.0769, -0.9962, 1.0001],
            [-0.997, -0.0632, -0.0446, -84.9344],
            [0, 0, 0, 1]],
        transformationMatrixCamToLidar: [[-0.0663516915626888, 0.0396829723346042, -0.996997658740693, -0.799760186924911],
            [0.994993204667150, 0.0769339896518345, -0.0631911603306386, 0.765992406314240],
            [0.0742461830195015, -0.996215314549491, -0.0445785343146626, -0.0810346195489563],
            [0, 0, 0, 1]],
        rotation: 305
    }],
    currentChannelLabel: document.getElementById('cam_channel'),
    // position of the lidar sensor in ego vehicle space
    positionLidarNuscenes: [0.891067, 0.0, 1.84292],//(long, lat, vert)
    positionLidarLISAT: [0, 0, 1.607137],
    translationVectorLidarToCamFront: [0.77, -0.02, -0.3],
    // positionLidarNuscenes: [1.84, 0.0, 1.84292],//(long, lat, vert)
    showOriginalNuScenesLabels: false,
    imageAspectRatioNuScenes: 1.777777778,
    imageAspectRatioLISAT: 1.333333333,
    imageAspectRatioFrontBackLISAT: 2.0,
    showFieldOfView: false,
    selectedMesh: undefined,
    folderEndPosition: undefined,
    folderEndSize: undefined,
    logger: undefined,
    timeElapsed: 0, // elapsed time in seconds
    timeElapsedScreenshot: 0, // elapsed time between two screenshots
    timeElapsedPlay: 0,

    /********** Externally defined functions **********
     * Define these functions in the labeling tools.
     **************************************************/

    // onLoadData: function (dataType, f) {
    //     this.localOnLoadData[dataType] = f;
    // },

    onInitialize: function (dataType, f) {
        this.localOnInitialize[dataType] = f;
    },

    /****************** Private functions **************/

    // localOnLoadData: {
    //     "CAM_FRONT_LEFT":
    //         function () {
    //         }
    //     ,
    //     "CAM_FRONT":
    //
    //         function () {
    //         }
    //
    //     ,
    //     "CAM_FRONT_RIGHT":
    //
    //         function () {
    //         }
    //
    //     ,
    //     "CAM_BACK_RIGHT":
    //
    //         function () {
    //         }
    //
    //     ,
    //     "CAM_BACK":
    //
    //         function () {
    //         }
    //
    //     ,
    //     "CAM_BACK_LEFT":
    //
    //         function () {
    //         }
    //
    //     ,
    //     "PCD":
    //
    //         function () {
    //         }
    // },

    localOnLoadAnnotation: {
        "CAM_FRONT_LEFT":

            function (index, annotation) {
            }

        ,
        "CAM_FRONT":

            function (index, annotation) {
            }

        ,
        "CAM_FRONT_RIGHT":

            function (index, annotation) {
            }

        ,
        "CAM_BACK_RIGHT":

            function (index, annotation) {
            }

        ,
        "CAM_BACK":

            function (index, annotation) {
            }

        ,
        "CAM_BACK_LEFT":

            function (index, annotation) {
            }

        ,
        "PCD":

            function (index, annotation) {
            }
    },

    localOnSelectBBox: {
        "CAM_FRONT_LEFT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_FRONT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_FRONT_RIGHT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK_RIGHT":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK":

            function (newIndex, oldIndex) {
            }

        ,
        "CAM_BACK_LEFT":

            function (newIndex, oldIndex) {
            }

        ,
        "PCD":

            function (newIndex, oldIndex) {
            }
    },

    localOnInitialize: {
        "CAM_FRONT_LEFT":

            function () {
            }

        ,
        "CAM_FRONT":

            function () {
            }

        ,
        "CAM_FRONT_RIGHT":

            function () {
            }

        ,
        "CAM_BACK_RIGHT":

            function () {
            }

        ,
        "CAM_BACK":

            function () {
            }

        ,
        "CAM_BACK_LEFT":

            function () {
            }

        ,
        "PCD":

            function () {
            }
    },

// Visualize 2d and 3d data
    showData: function () {
        if (labelTool.cameraImagesLoaded === false) {
            for (let i = 0; i < this.numFrames; i++) {
                for (let camChannelObj in this.camChannels) {
                    if (this.camChannels.hasOwnProperty(camChannelObj)) {
                        let camChannelObject = this.camChannels[camChannelObj];
                        loadCameraImages(camChannelObject.channel, i);
                    }
                }
                imageArrayAll.push(imageArray);
            }
            labelTool.cameraImagesLoaded = true;
        }
        // show 6 camera images of current frame
        for (let i = 0; i < 6; i++) {
            imageArrayAll[labelTool.currentFileIndex][i].toBack();
        }


        // draw 2D bb for all objects
        // note that last element is the 'insertIndex' -> iterate until length-1
        if (annotationObjects.contents !== undefined && annotationObjects.contents.length > 0) {
            for (let j = 0; j < annotationObjects.contents[this.currentFileIndex].length - 1; j++) {
                let annotationObj = annotationObjects.contents[this.currentFileIndex][j];
                let params = setObjectParameters(annotationObj);
                draw2DProjections(params);
                // set new params
                for (let i = 0; i < annotationObj["channels"].length; i++) {
                    annotationObjects.contents[this.currentFileIndex][j]["channels"][i]["lines"] = params["channels"][i]["lines"];
                }
            }
        }
        loadPCDData();
    },

    setTrackIds: function () {
        for (let annotationObj in annotationObjects.contents[labelTool.currentFileIndex]) {
            let annotation = annotationObjects.contents[labelTool.currentFileIndex][annotationObj];
            let label = annotation["class"];
            classesBoundingBox[label].nextTrackId++;
        }
    },
    loadAnnotationsNuscenes: function (annotations, fileIndex) {
        // Remove old bounding boxes of current frame.
        annotationObjects.clear();
        // Add new bounding boxes.
        for (let i in annotations) {
            // convert 2D bounding box to integer values
            if (annotations.hasOwnProperty(i)) {
                ["left", "right", "top", "bottom"].forEach(function (key) {
                    annotations[i][key] = parseInt(annotations[i][key]);
                });
                let annotation = annotations[i];
                // annotationObjects.selectEmpty();
                let params = getDefaultObject();
                params.class = annotation.class;
                params.rotationY = parseFloat(annotation.rotationY);
                params.original.rotationY = parseFloat(annotation.rotationY);
                if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                    classesBoundingBox.addNuSceneLabel(annotation.class);
                    classesBoundingBox.__target = Object.keys(classesBoundingBox.content)[0];
                    params.trackId = classesBoundingBox.content[annotation.class].nextTrackId;
                    classesBoundingBox.content[annotation.class].nextTrackId++;
                } else {
                    params.trackId = annotation.trackId;
                    classesBoundingBox[annotation.class].nextTrackId++;
                }

                // Nuscenes labels are stored in global frame in the database
                // Nuscenes: labels (3d positions) are transformed from global frame to point cloud (global -> ego, ego -> point cloud) before exporting them
                params.x = parseFloat(annotation.x);
                params.y = -parseFloat(annotation.y);
                params.z = parseFloat(annotation.z);
                params.original.x = parseFloat(annotation.x);
                params.original.y = -parseFloat(annotation.y);
                params.original.z = parseFloat(annotation.z);
                let tmpWidth = parseFloat(annotation.width);
                let tmpHeight = parseFloat(annotation.height);
                let tmpDepth = parseFloat(annotation.length);
                if (tmpWidth !== 0.0 && tmpHeight !== 0.0 && tmpDepth !== 0.0) {
                    tmpWidth = Math.max(tmpWidth, 0.0001);
                    tmpHeight = Math.max(tmpHeight, 0.0001);
                    tmpDepth = Math.max(tmpDepth, 0.0001);
                    params.width = tmpWidth;
                    params.height = tmpHeight;
                    params.depth = tmpDepth;
                    params.original.width = tmpWidth;
                    params.original.height = tmpHeight;
                    params.original.depth = tmpDepth;
                }
                params.fileIndex = fileIndex;
                // project 3D position into 2D camera image
                draw2DProjections(params);
                // add new entry to contents array
                annotationObjects.set(annotationObjects.__insertIndex, params);
                annotationObjects.__insertIndex++;
                classesBoundingBox.target().nextTrackId++;
            }
        }
    },
    // Set values to this.annotationObjects from allAnnotations
    loadAnnotationsJSON: function (allAnnotations) {
        // Remove old bounding boxes of current frame.
        annotationObjects.clear();
        let maxTrackIds = [0, 0, 0, 0, 0];// vehicle, truck, motorcycle, bicycle, pedestrian
        // Add new bounding boxes.
        //for (let frameAnnotationIdx in allAnnotations) {
        for (let i = 0; i < labelTool.numFrames; i++) {
            // convert 2D bounding box to integer values
            let frameAnnotations = allAnnotations[i];

            for (let annotationIdx in frameAnnotations) {
                if (frameAnnotations.hasOwnProperty(annotationIdx)) {
                    let annotation = frameAnnotations[annotationIdx];
                    let params = getDefaultObject();
                    params.class = annotation.class;
                    params.rotationY = parseFloat(annotation.rotationY);
                    params.original.rotationY = parseFloat(annotation.rotationY);
                    let classIdx;
                    params.trackId = annotation.trackId;
                    classIdx = classesBoundingBox[annotation.class].index;
                    if (params.trackId > maxTrackIds[classIdx]) {
                        maxTrackIds[classIdx] = params.trackId;
                    }
                    // Nuscenes labels are stored in global frame in the database
                    // Nuscenes: labels (3d positions) are transformed from global frame to point cloud (global -> ego, ego -> point cloud) before exporting them
                    // LISAT: labels are stored in ego frame which is also the point cloud frame (no transformation needed)
                    // if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                    params.x = parseFloat(annotation.x);
                    params.y = parseFloat(annotation.y);
                    params.z = parseFloat(annotation.z);
                    params.original.x = parseFloat(annotation.x);
                    params.original.y = parseFloat(annotation.y);
                    params.original.z = parseFloat(annotation.z);
                    let tmpWidth = parseFloat(annotation.width);
                    let tmpHeight = parseFloat(annotation.height);
                    let tmpDepth = parseFloat(annotation.length);
                    if (tmpWidth > 0.3 && tmpHeight > 0.3 && tmpDepth > 0.3) {
                        tmpWidth = Math.max(tmpWidth, 0.0001);
                        tmpHeight = Math.max(tmpHeight, 0.0001);
                        tmpDepth = Math.max(tmpDepth, 0.0001);
                        params.delta_x = 0;
                        params.delta_y = 0;
                        params.delta_z = 0;
                        params.width = tmpWidth;
                        params.height = tmpHeight;
                        params.depth = tmpDepth;
                        params.original.width = tmpWidth;
                        params.original.height = tmpHeight;
                        params.original.depth = tmpDepth;
                    }
                    params.fileIndex = Number(i);
                    // add new entry to contents array
                    annotationObjects.set(annotationObjects.__insertIndex, params);
                    annotationObjects.__insertIndex++;
                    if (labelTool.showOriginalNuScenesLabels === true) {
                        classesBoundingBox.content[classesBoundingBox.targetName()].nextTrackId++;
                    } else {
                        classesBoundingBox.target().nextTrackId++;
                    }


                }
            }//end for loop frame annotations
            // reset track ids for next frame if nuscenes dataset and showLabels=true
            if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
                for (let i = 0; i < classesBoundingBox.classNameArray.length; i++) {
                    classesBoundingBox.content[classesBoundingBox.classNameArray[i]].nextTrackId = 0;
                }
            }
            // reset insert index
            annotationObjects.__insertIndex = 0;
        }// end for loop all annotations

        if (labelTool.showOriginalNuScenesLabels === true) {
            let keys = Object.keys(classesBoundingBox.content);
            for (let i = 0; i < maxTrackIds.length; i++) {
                classesBoundingBox.content[keys[i]].nextTrackId = maxTrackIds[i] + 1;
            }
        } else {
            let keys = Object.keys(classesBoundingBox);
            for (let i = 0; i < maxTrackIds.length; i++) {
                classesBoundingBox[keys[i]].nextTrackId = maxTrackIds[i] + 1;
            }
        }
        // project 3D positions of current frame into 2D camera images
        if (annotationObjects.contents[this.currentFileIndex].length > 0) {
            for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
                draw2DProjections(annotationObjects.contents[this.currentFileIndex][i]);
            }
        }
    },

    // Create annotations from this.annotationObjects
    createAnnotations: function () {
        let allAnnotations = [];
        for (let j = 0; j < this.numFrames; j++) {
            let annotationsInFrame = [];
            for (let i = 0; i < annotationObjects.contents[j].length; i++) {
                if (annotationObjects.contents[j][i] !== undefined && this.cubeArray[j][i] !== undefined) {
                    let annotationObj = annotationObjects.contents[j][i];
                    // LISAT: labels are stored in ego frame which is also the point cloud frame (no transformation needed)
                    // Nuscenes labels are stored in global frame within database
                    // [optional] Nuscenes: transform 3d positions from point cloud to global frame (point cloud-> ego, ego -> global)
                    let annotation = {
                        class: annotationObj["class"],
                        // TODO: store information of 3D objects also in annotationObjects.contents instead of cubeArray
                        height: this.cubeArray[j][i].scale.y,
                        width: this.cubeArray[j][i].scale.x,
                        length: this.cubeArray[j][i].scale.z, // depth
                        x: this.cubeArray[j][i].position.x,
                        y: this.cubeArray[j][i].position.y,
                        z: this.cubeArray[j][i].position.z,
                        rotationY: this.cubeArray[j][i].rotation.z,
                        trackId: annotationObj["trackId"],
                        frameIdx: j
                    };
                    annotationsInFrame.push(annotation);
                }
            }
            allAnnotations.push(annotationsInFrame);
        }
        return allAnnotations;
    },

    initialize: function () {
        initPanes();

        initFrameSelector();
        $(".current").text((labelTool.currentFileIndex + 1) + "/" + this.fileNames.length);

        let imageContainer = $("#layout_layout_panel_top .w2ui-panel-content");
        // create six image divs

        // ---------------------------------------------------------------
        // for (let channelIdx in labelTool.camChannels) {
        //     if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
        //         let channel = labelTool.camChannels[channelIdx].channel;
        //         let id = "image-" + channel.toLowerCase().replace(/_/g, '-');
        //         let minWidth = window.innerWidth / 6;
        //         let minHeight = minWidth * 1.7778;
        //         imageContainer.append("<div id='" + id + "'></div>");
        //         $("#" + id).css("width", minWidth);
        //         $("#" + id).css("height", minHeight);
        //         let canvasElem = imageContainer["0"].children[channelIdx];
        //
        //         canvasArray.push(canvasElem);
        //         let imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
        //         if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        //             if (channel === "CAM_BACK" || channel === "CAM_FRONT") {
        //                 imageWidth = labelTool.imageSizes["LISA_T"]["minWidthWide"];
        //             } else {
        //                 imageWidth = labelTool.imageSizes["LISA_T"]["minWidthNormal"];
        //             }
        //         } else {
        //             imageWidth = labelTool.imageSizes["NuScenes"]["minWidthNormal"];
        //         }
        //         paperArray.push(Raphael(canvasElem, imageWidth, imagePanelTopPos));
        //     }
        // }

        //-------------------------------------------------------------
        let imageWidth;
        let canvasElem;
        let imagePanelTopPos;
        for (let i = 0; i < labelTool.numFrames; i++) {
            paperArray = [];
            for (let channelIdx = 0; channelIdx < labelTool.camChannels.length; channelIdx++) {
                if (labelTool.imageCanvasInitialized === false) {
                    let channel = labelTool.camChannels[channelIdx].channel;
                    let id = "image-" + channel.toLowerCase().replace(/_/g, '-');
                    let minWidth = window.innerWidth / 6;
                    let minHeight = minWidth * 1.7778;
                    imageContainer.append("<div id='" + id + "'></div>");
                    $("#" + id).css("width", minWidth);
                    $("#" + id).css("height", minHeight);
                    canvasElem = imageContainer["0"].children[channelIdx];
                    canvasArray.push(canvasElem);
                    imagePanelTopPos = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                        if (channel === "CAM_BACK" || channel === "CAM_FRONT") {
                            imageWidth = labelTool.imageSizes["LISA_T"]["minWidthWide"];
                        } else {
                            imageWidth = labelTool.imageSizes["LISA_T"]["minWidthNormal"];
                        }
                    } else {
                        imageWidth = labelTool.imageSizes["NuScenes"]["minWidthNormal"];
                    }
                }
                paperArray.push(Raphael(canvasArray[channelIdx], imageWidth, imagePanelTopPos));
            }
            labelTool.imageCanvasInitialized = true;
            paperArrayAll.push(paperArray);
        }
        // ---------------------------------------------------------------

        // make image container scrollable
        $("#layout_layout_panel_top .w2ui-panel-content").addClass("dragscroll");
        $("#layout_layout_panel_top .w2ui-panel-content").css("overflow", "scroll");

        let pointCloudContainer = $("#layout_layout_panel_main .w2ui-panel-content");
        pointCloudContainer.append('<div id="canvas3d" style="z-index: 0;"></div>');

        // this.pageBox.placeholder = (this.currentFileIndex + 1) + "/" + this.fileNames.length;
        this.camChannels.forEach(function (channelObj) {
            this.localOnInitialize[channelObj.channel]();
        }.bind(this));
        this.localOnInitialize["PCD"]();

        $(function () {
            $('#class-picker>ul>li').hover(function () {
                $(this).css('background-color', "#535353");
            }, function () {
                // on mouseout, reset the background color if not selected
                let currentClass = classesBoundingBox.getCurrentClass();
                let currentClassIndex = classesBoundingBox[currentClass].index;
                let currentHoverIndex = $("#class-picker>ul>li").index(this);
                if (currentClassIndex !== currentHoverIndex) {
                    $(this).css('background-color', "#353535");
                }
            });
        });

        let toasts = $(".toasts")[0];
        this.logger = new Toast(toasts);

        if (labelTool.currentDataset === labelTool.datasets.NuScenes) {
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let channel = labelTool.camChannels[channelIdx].channel;
                    let id = "image-" + channel.toLowerCase().replace(/_/g, '-');
                    let minWidth = window.innerWidth / 6;
                    let minHeight = minWidth / 1.7778;
                    $("#" + id).css("width", minWidth);
                    $("#" + id).css("height", minHeight);
                }
            }
        }
    },

    getAnnotations() {
        let fileName;
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            fileName = labelTool.currentDataset + "_" + labelTool.currentSequence + "_annotations.txt";
            request({
                url: '/label/annotations/',
                type: 'GET',
                dataType: 'json',
                data: {
                    file_name: fileName
                },
                success: function (res) {
                    if (res !== undefined && res.length > 0) {
                        this.loadAnnotationsJSON(res);
                    }
                }.bind(this),
                error: function (res) {
                }.bind(this)
            });
        } else {
            if (labelTool.showOriginalNuScenesLabels === true) {
                for (let i = 0; i < this.fileNames.length; i++) {
                    fileName = this.fileNames[i] + ".txt";
                    request({
                        url: '/label/annotations/',
                        type: 'GET',
                        dataType: 'json',
                        data: {
                            file_name: fileName
                        },
                        success: function (res) {
                            this.loadAnnotationsNuscenes(res, i);
                        }.bind(this),
                        error: function (res) {
                        }.bind(this)
                    });
                }
            } else {
                fileName = labelTool.currentDataset + "_" + labelTool.currentSequence + "_annotations.txt";
                request({
                    url: '/label/annotations/',
                    type: 'GET',
                    dataType: 'json',
                    data: {
                        file_name: fileName
                    },
                    success: function (res) {
                        this.loadAnnotationsJSON(res);
                    }.bind(this),
                    error: function (res) {
                    }.bind(this)
                });
            }
        }


    },

    reset() {
        for (let i = scene.children.length; i >= 0; i--) {
            let obj = scene.children[i];
            scene.remove(obj);
        }

        // base label tool
        this.currentFileIndex = 0;
        this.fileNames = [];
        this.originalAnnotations = [];
        this.targetClass = "Vehicle";
        this.savedFrames = [];
        this.cubeArray = [];
        this.currentCameraChannelIndex = 0;
        for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
            let annotationObj = annotationObjects.contents[this.currentFileIndex][i];
            guiOptions.removeFolder(annotationObj["class"] + ' ' + annotationObj["trackId"]);
        }
        annotationObjects.contents = [];
        $(".class-tooltip").remove();
        this.spriteArray = [];
        this.selectedMesh = undefined;
        this.imageCanvasInitialized = false;
        this.cameraImagesLoaded = false;
        this.pointCloudLoaded = false;
        $(".frame-selector__frames").empty();

        // classesBoundingBox
        classesBoundingBox.colorIdx = 0;
        classesBoundingBox.__target = Object.keys(classesBoundingBox)[0];

        // image label tool
        canvasArray = [];
        canvasParamsArray = [];
        paperArray = [];
        paperArrayAll = [];
        imageArray = [];
        // pcd label tool
        folderBoundingBox3DArray = [];
        folderPositionArray = [];
        folderSizeArray = [];
        pointCloudScanList = [];

        let classPickerElem = $('#class-picker ul li');
        classPickerElem.css('background-color', '#353535');
        $(classPickerElem[0]).css('background-color', '#525252');
        classPickerElem.css('border-bottom', '0px');

        classPickerElem.each(function (i, item) {
            let propNamesArray = Object.getOwnPropertyNames(classesBoundingBox);
            let color = classesBoundingBox[propNamesArray[i]].color;
            let attribute = "20px solid" + ' ' + color;
            $(item).css("border-left", attribute);
            $(item).css('border-bottom', '0px');
        });

        // remove image divs
        $("#layout_layout_panel_top .w2ui-panel-content").empty();

        if (this.currentDataset === this.datasets.LISA_T) {
            w2ui['layout'].panels[0].maxSize = 480;
            w2ui['layout'].panels[0].minSize = 240;
            w2ui['layout'].panels[0].size = 240;
        } else {
            w2ui['layout'].panels[0].minSize = Math.ceil(window.innerWidth) / (6 * 1.7778);
            w2ui['layout'].panels[0].maxSize = 360;

            w2ui['layout'].panels[0].size = Math.ceil(window.innerWidth) / (6 * 1.7778);

        }
        w2ui['layout'].resize();

        classesBoundingBox.content = [];
        $("#frame-selector__frames").empty();
    },

    start() {
        initTimer();
        setImageSize();
        labelTool.fileNames = this.getFileNames();
        this.initialize();
        setPanelSize(labelTool.currentFileIndex);
        this.showData();
        this.getAnnotations();
    },


    getFileNames() {
        let numFiles;
        let fileNameArray = [];
        if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
            if (labelTool.currentSequence === labelTool.sequencesLISAT.date_2018_05_23_001_frame_00042917_00043816_small) {
                labelTool.numFrames = 300;
                numFiles = 300;
            } else {
                labelTool.numFrames = labelTool.numFramesLISAT;
                // TODO: temporary set to 100 for testing (default: 900)
                numFiles = 50;
            }

        } else {
            labelTool.numFrames = labelTool.numFramesNuScenes;
            setSequences();
            labelTool.currentSequence = labelTool.sequencesNuScenes[0];
            numFiles = 120;//[3962, 120]
        }
        for (let i = 0; i < numFiles; i++) {
            fileNameArray.push(pad(i, 6))
        }
        return fileNameArray;
    },

    // previousCamChannel: function () {
    //     var currentChannel = this.currentCameraChannelIndex;
    //     this.currentCameraChannelIndex = this.currentCameraChannelIndex - 1;
    //     if (this.currentCameraChannelIndex < 0) {
    //         this.currentCameraChannelIndex = 5;
    //     }
    //     this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    // }
    // ,
    //
    // nextCamChannel: function () {
    //     var currentChannel = this.currentCameraChannelIndex;
    //     this.currentCameraChannelIndex = this.currentCameraChannelIndex + 1;
    //     if (this.currentCameraChannelIndex > 5) {
    //         this.currentCameraChannelIndex = 0;
    //     }
    //     this.changeCamChannel(currentChannel, this.currentCameraChannelIndex % 6);
    // }
    // ,

    previousFrame: function () {
        if (this.currentFileIndex >= this.skipFrameCount) {
            this.changeFrame(this.currentFileIndex - this.skipFrameCount);
        } else if (this.currentFileIndex !== 0) {
            this.changeFrame(0);
        }
    },

    nextFrame: function () {
        let start = new Date().getTime();
        if (this.currentFileIndex < (this.fileNames.length - 1 - this.skipFrameCount)) {
            this.changeFrame(this.currentFileIndex + this.skipFrameCount);
        } else if (this.currentFileIndex !== this.fileNames.length - 1) {
            this.changeFrame(this.fileNames.length - 1);
        }
        let end = new Date().getTime();
        let time = end - start;
        console.log(time);
    },

    jumpFrame: function () {
        if (0 <= Number(this.pageBox.value) - 1 && Number(this.pageBox.value) - 1 < this.fileNames.length) {
            this.changeFrame(Number(this.pageBox.value) - 1);
        }
    },

    removeObject: function (objectName) {
        for (let i = scene.children.length - 1; i >= 0; i--) {
            let obj = scene.children[i];
            if (obj.name === objectName) {
                scene.remove(obj);
                return true;
            }
        }
        return false;
    },
    createPlane: function (name, angle, xpos, ypos, channel) {
        let channelIdx = getChannelIndexByName(channel);
        let geometryRightPlane = new THREE.BoxGeometry(this.camChannels[channelIdx].fieldOfView, 2, 0.08);
        geometryRightPlane.rotateX(Math.PI / 2);
        geometryRightPlane.rotateZ(angle);
        geometryRightPlane.translate(ypos, xpos, -0.7);//y/x/z
        let material = new THREE.MeshBasicMaterial({
            color: 0x525252,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        let planeRight = new THREE.Mesh(geometryRightPlane, material);
        planeRight.name = name;
        scene.add(planeRight);
    },
    createPrism: function (angle, posx, posy, width, openingLength, offsetX) {
        let posXCenter = 0 * Math.cos(angle) - offsetX * Math.sin(angle);
        let posYCenter = 0 * Math.sin(angle) + offsetX * Math.cos(angle);
        let positionCornerCenter = new THREE.Vector2(posXCenter, posYCenter);
        let posXLeft = -width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        let posYLeft = -width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        let positionCornerLeft = new THREE.Vector2(posXLeft, posYLeft);
        let posXRight = width * Math.cos(angle) - openingLength / 2 * Math.sin(angle);
        let posYRight = width * Math.sin(angle) + openingLength / 2 * Math.cos(angle);
        let positionCornerRight = new THREE.Vector2(posXRight, posYRight);
        let materialPrism = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5});
        let height = 2;
        let geometryPrism = new PrismGeometry([positionCornerCenter, positionCornerLeft, positionCornerRight], height);
        geometryPrism.translate(-posy, posx, -1.7);
        let prismMesh = new THREE.Mesh(geometryPrism, materialPrism);
        prismMesh.name = "prism";
        scene.add(prismMesh);
    },
    drawFieldOfView: function () {
        switch (labelTool.currentCameraChannelIndex) {
            case 0:
                // front left
                this.createPlane('rightplane', Math.PI / 2 - 340 * 2 * Math.PI / 360, this.camChannels[0].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(340 * 2 * Math.PI / 360), -this.camChannels[0].positionCameraNuScenes[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(340 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 270 * 2 * Math.PI / 360, this.camChannels[0].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[0].fieldOfView / 2 * Math.cos(270 * 2 * Math.PI / 360), -this.camChannels[0].positionCameraNuScenes[1] + this.camChannels[0].fieldOfView / 2 * Math.sin(270 * 2 * Math.PI / 360), "CAM_FRONT_LEFT");
                this.createPrism(-305 * 2 * Math.PI / 360, this.camChannels[0].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[0].positionCameraNuScenes[1], 0.3, 1.0, 0.073);
                break;
            case 1:
                // front
                this.createPlane('rightplane', Math.PI / 2 - 35 * 2 * Math.PI / 360, this.camChannels[1].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(35 * 2 * Math.PI / 360), -this.camChannels[1].positionCameraNuScenes[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPlane('leftplane', Math.PI / 2 - (-35) * 2 * Math.PI / 360, this.camChannels[1].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[1].fieldOfView / 2 * Math.cos(-35 * 2 * Math.PI / 360), -this.camChannels[1].positionCameraNuScenes[1] + this.camChannels[1].fieldOfView / 2 * Math.sin(-35 * 2 * Math.PI / 360), "CAM_FRONT");
                this.createPrism(0 * 2 * Math.PI / 360, this.camChannels[1].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[1].positionCameraNuScenes[1], 0.3, 1.0, 0.073);
                break;
            case 2:
                // front right
                this.createPlane('rightplane', Math.PI / 2 - 90 * 2 * Math.PI / 360, this.camChannels[2].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(90 * 2 * Math.PI / 360), -this.camChannels[2].positionCameraNuScenes[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(90 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 20 * 2 * Math.PI / 360, this.camChannels[2].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[2].fieldOfView / 2 * Math.cos(20 * 2 * Math.PI / 360), -this.camChannels[2].positionCameraNuScenes[1] + this.camChannels[2].fieldOfView / 2 * Math.sin(20 * 2 * Math.PI / 360), "CAM_FRONT_RIGHT");
                this.createPrism(-55 * 2 * Math.PI / 360, this.camChannels[2].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[2].positionCameraNuScenes[1], 0.3, 1.0, 0.073);
                break;
            case 3:
                // back right
                this.createPlane('rightplane', Math.PI / 2 - 145 * 2 * Math.PI / 360, this.camChannels[3].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(145 * 2 * Math.PI / 360), -this.camChannels[3].positionCameraNuScenes[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(145 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPlane('leftplane', Math.PI / 2 - 75 * 2 * Math.PI / 360, this.camChannels[3].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[3].fieldOfView / 2 * Math.cos(75 * 2 * Math.PI / 360), -this.camChannels[3].positionCameraNuScenes[1] + this.camChannels[3].fieldOfView / 2 * Math.sin(75 * 2 * Math.PI / 360), "CAM_BACK_RIGHT");
                this.createPrism(-110 * 2 * Math.PI / 360, this.camChannels[3].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[3].positionCameraNuScenes[1], 0.3, 1.0, 0.073);
                break;
            case 4:
                // back
                this.createPlane('rightplane', Math.PI / 2 - 245 * 2 * Math.PI / 360, this.camChannels[4].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(245 * 2 * Math.PI / 360), -this.camChannels[4].positionCameraNuScenes[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(245 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPlane('leftplane', Math.PI / 2 - 115 * 2 * Math.PI / 360, this.camChannels[4].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[4].fieldOfView / 2 * Math.cos(115 * 2 * Math.PI / 360), -this.camChannels[4].positionCameraNuScenes[1] + this.camChannels[4].fieldOfView / 2 * Math.sin(115 * 2 * Math.PI / 360), "CAM_BACK");
                this.createPrism(-180 * 2 * Math.PI / 360, this.camChannels[4].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[4].positionCameraNuScenes[1], 0.97, 1.0, 0.046);
                break;
            case 5:
                // back left
                this.createPlane('rightplane', Math.PI / 2 - 285 * 2 * Math.PI / 360, this.camChannels[5].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(285 * 2 * Math.PI / 360), -this.camChannels[5].positionCameraNuScenes[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(285 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPlane('leftplane', Math.PI / 2 - 215 * 2 * Math.PI / 360, this.camChannels[5].positionCameraNuScenes[0] - this.positionLidarNuscenes[0] + this.camChannels[5].fieldOfView / 2 * Math.cos(215 * 2 * Math.PI / 360), -this.camChannels[5].positionCameraNuScenes[1] + this.camChannels[5].fieldOfView / 2 * Math.sin(215 * 2 * Math.PI / 360), "CAM_BACK_LEFT");
                this.createPrism(-250 * 2 * Math.PI / 360, this.camChannels[5].positionCameraNuScenes[0] - this.positionLidarNuscenes[0], this.camChannels[5].positionCameraNuScenes[1], 0.3, 1.0, 0.073);
                break;
        }
    },
    // changeCamChannel: function (currentChannelNumber, nextChannelNumber) {
    //     // if (this.dataTypes.indexOf("PCD") >= 0) {
    //     //     // remove all folder of current channel
    //     //     for (var k = 0; k < annotationObjects.contents.length; k++) {
    //     //         guiOptions.removeFolder(annotationObjects.contents[k]["class"] + ' ' + annotationObjects.contents[k]["trackId"]);
    //     //     }
    //     // }
    //     if (this.hasLoadedPCD) {
    //         cFlag = false;
    //         rFlag = false;
    //         this.bboxes = [];
    //         // do not delete bounding boxes that were set previously
    //         // this.cubeArray[this.currentFileIndex][this.currentCameraChannelIndex] = [];
    //         numbertagList = [];
    //         folderBoundingBox3DArray = [];
    //         guiTag = [];
    //         numbertagList = [];
    //         folderPositionArray = [];
    //         folderSizeArray = [];
    //         this.bboxIndexArray[labelTool.currentFileIndex][labelTool.currentCameraChannelIndex] = [];
    //     }
    //     var previousChannelNumber = currentChannelNumber - 1;
    //     if (previousChannelNumber < 0) {
    //         previousChannelNumber = 5;
    //     }
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(previousChannelNumber)] = false;
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(currentChannelNumber)] = false;
    //     this.hasLoadedImage[labelTool.camChannels.indexOf(nextChannelNumber)] = false;
    //     this.hasLoadedPCD = false;
    //     this.showData();
    //
    //     // render labels
    //     // hold flag not set
    //     if (this.savedFrames[this.currentFileIndex][this.currentCameraChannelIndex] == true) {
    //
    //     } else {
    //         // load annotations from file for all three camera views if they exist, otherwise show blank image
    //         if (annotationFileExist(this.currentFileIndex)) {
    //             this.getAnnotations(this.currentFileIndex);
    //         } else {
    //             // no annotations are loaded
    //             annotationObjects.clear();
    //         }
    //     }
    //
    //     // change FOV of camera
    //     this.removeObject('rightplane');
    //     this.removeObject('leftplane');
    //     this.removeObject('prism');
    //     this.drawFieldOfView();
    //
    //
    // }
    // ,
    changeFrame: function (newFileIndex) {
        if (newFileIndex === labelTool.numFrames - 1 && labelTool.playSequence === true) {
            // last frame will be shown
            // stop playing sequence
            labelTool.playSequence = false;
        }

        interpolationObjIndexCurrentFile = annotationObjects.getSelectionIndex();
        if (interpolationObjIndexCurrentFile === -1 && interpolationMode === true) {
            labelTool.logger.error("Please select an object for interpolation or uncheck interpolation mode.");
            return;
        }

        labelTool.removeObject("pointcloud-scan-" + this.currentFileIndex);
        labelTool.removeObject("pointcloud-scan-no-ground-" + this.currentFileIndex);

        // -------------------------------------------------
        // for (let i = 0; i < this.camChannels.length; i++) {
        //     let img = imageArrayAll[this.currentFileIndex][i];
        //     if (img !== undefined) {
        //         img.remove();
        //     }
        // }
        // -------------------------------------------------
        // bring current image into background instead of removing it
        setPanelSize(newFileIndex);
        // -------------------------------------------------


        // remove all 3D BB objects from scene
        for (let i = scene.children.length; i >= 0; i--) {
            let obj = scene.children[i];
            scene.remove(obj);
        }
        // remove all 2D BB objects from camera images
        remove2DBoundingBoxes();
        // remove all class labels in point cloud or bird eye view
        $(".class-tooltip").remove();

        // store copy flags before removing folder
        let copyFlags = [];
        // remove all folders
        for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
            let checkboxElem = document.getElementById("copy-label-to-next-frame-checkbox-" + i);
            if (checkboxElem !== null) {
                copyFlags.push(checkboxElem.firstChild.checked);
            }
            guiOptions.removeFolder(annotationObjects.contents[this.currentFileIndex][i]["class"] + ' ' + annotationObjects.contents[this.currentFileIndex][i]["trackId"]);
        }
        // empty all folder arrays
        folderBoundingBox3DArray = [];
        folderPositionArray = [];
        folderSizeArray = [];

        if (this.cubeArray[newFileIndex].length === 0) {
            // move 3D objects to new frame if nextFrame has no labels and copy flag is set
            for (let i = 0; i < this.cubeArray[this.currentFileIndex].length; i++) {
                let copyLabelToNextFrame = copyFlags[i];
                if (copyLabelToNextFrame === true) {
                    let mesh = this.cubeArray[this.currentFileIndex][i];
                    let clonedMesh = mesh.clone();
                    this.cubeArray[newFileIndex].push(clonedMesh);
                    scene.add(clonedMesh);

                    let sprite = this.spriteArray[this.currentFileIndex][i];
                    let clonedSprite = sprite.clone();
                    this.spriteArray[newFileIndex].push(clonedSprite);
                    scene.add(clonedSprite);
                }
            }
            // Deep copy
            for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
                //let copyLabelToNextFrame = annotationObjects.contents[this.currentFileIndex][i]["copyLabelToNextFrame"];
                let copyLabelToNextFrame = copyFlags[i];
                if (copyLabelToNextFrame === true) {
                    if (interpolationMode === true) {
                        // set start index
                        annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEndFileIndex"] = newFileIndex;
                    }
                    annotationObjects.contents[newFileIndex].push(jQuery.extend(true, {}, annotationObjects.contents[this.currentFileIndex][i]));
                }
            }
        } else {
            // next frame has already 3D annotations which will be added to the scene
            for (let i = 0; i < this.cubeArray[newFileIndex].length; i++) {
                let mesh = this.cubeArray[newFileIndex][i];
                scene.add(mesh);
                let sprite = this.spriteArray[newFileIndex][i];
                scene.add(sprite);

                let trackId = annotationObjects.contents[newFileIndex][i]["trackId"];
                let className = annotationObjects.contents[newFileIndex][i]["class"];
                // let objectIndexByTrackIdAndClass = getObjectIndexByTrackIdAndClass(trackId, className, this.currentFileIndex);
                // if (objectIndexByTrackIdAndClass !== -1) {
                // next frame contains a new object -> add tooltip for new object
                let classTooltipElement = $("<div class='class-tooltip' id='tooltip-" + className.charAt(0) + trackId + "'>" + trackId + "</div>");
                // set background color
                let color = classesBoundingBox[className].color;
                let imagePaneHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
                const vector = new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z + mesh.scale.z / 2);
                const canvas = renderer.domElement;
                vector.project(currentCamera);
                vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width));
                vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height));
                $(classTooltipElement[0]).css("top", `${vector.y + headerHeight + imagePaneHeight - 21}px`);
                $(classTooltipElement[0]).css("left", `${vector.x}px`);
                $(classTooltipElement[0]).css("opacity", 1.0);

                $("body").append(classTooltipElement);
                // }
            }
            for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
                let trackId = annotationObjects.contents[this.currentFileIndex][i]["trackId"];
                let className = annotationObjects.contents[this.currentFileIndex][i]["class"];
                let objectIndexByTrackIdAndClass = getObjectIndexByTrackIdAndClass(trackId, className, newFileIndex);
                let copyLabelToNextFrame = copyFlags[i];
                if (objectIndexByTrackIdAndClass === -1 && copyLabelToNextFrame === true) {
                    // clone that object to new frame if copy flag set and it not yet exist in next frame
                    let mesh = this.cubeArray[this.currentFileIndex][i];
                    let clonedMesh = mesh.clone();
                    this.cubeArray[newFileIndex].push(clonedMesh);
                    scene.add(clonedMesh);
                    let sprite = this.spriteArray[this.currentFileIndex][i];
                    let clonedSprite = sprite.clone();
                    this.spriteArray[newFileIndex].push(clonedSprite);
                    scene.add(clonedSprite);
                    annotationObjects.contents[newFileIndex].push(jQuery.extend(true, {}, annotationObjects.contents[this.currentFileIndex][i]));
                }
            }
        }

        // this.pageBox.placeholder = (newFileIndex + 1) + "/" + this.fileNames.length;
        $(".current").text((newFileIndex + 1) + "/" + this.fileNames.length);
        // this.pageBox.value = "";
        // set class selected to current frame bar
        // unselect all
        $("div.frame").attr("class", "frame default");
        let currentBar = $("div.frame")[newFileIndex];
        currentBar.className = "frame default selected";


        let bboxEndParams = undefined;
        if (interpolationMode === true) {
            bboxEndParams = {
                x: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["x"],
                y: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["y"],
                z: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["z"],
                rotationY: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["rotationY"],
                width: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["width"],
                height: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["height"],
                depth: annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["depth"],
                newFileIndex: newFileIndex
            };
        }

        let selectionIndexNextFile = -1;
        if (interpolationObjIndexCurrentFile !== -1) {
            if (interpolationMode === true) {
                selectionIndexNextFile = getObjectIndexByTrackIdAndClass(annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["class"], newFileIndex);
            } else {
                if (annotationObjects.getSelectionIndex() !== -1 && annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()] !== undefined) {
                    selectionIndexNextFile = getObjectIndexByTrackIdAndClass(annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()]["trackId"], annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()]["class"], newFileIndex);
                }

            }
        }
        // update folders with values of next/previous frame
        for (let i = 0; i < annotationObjects.contents[newFileIndex].length; i++) {
            let annotationObj = annotationObjects.contents[newFileIndex][i];
            let copyFlag;
            // if next object exists in current frame then use copy flag of current frame
            let indexInCurrentFile = getObjectIndexByTrackIdAndClass(annotationObj["trackId"], annotationObj["class"], this.currentFileIndex);
            if (indexInCurrentFile === -1) {
                //object does not exist in current frame -> use copy index of next frame
                copyFlag = annotationObj["copyLabelToNextFrame"];
            } else {
                copyFlag = copyFlags[indexInCurrentFile];
            }
            let bbox = {
                class: annotationObj["class"],
                x: annotationObj["x"],
                y: annotationObj["y"],
                z: annotationObj["z"],
                width: annotationObj["width"],
                height: annotationObj["height"],
                depth: annotationObj["depth"],
                rotationY: parseFloat(annotationObj["rotationY"]),
                trackId: annotationObj["trackId"],
                copyLabelToNextFrame: copyFlag
            };
            // add bboxEnd for selected object
            if (selectionIndexNextFile === i && interpolationMode === true) {
                addBoundingBoxGui(bbox, bboxEndParams);
            } else {
                addBoundingBoxGui(bbox, undefined);
            }
        }
        if (interpolationMode === true) {
            // clone current object position and scale and set it to end position and end scale
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["x"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["x"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["y"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["y"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["z"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["z"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["position"]["rotationY"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["rotationY"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["width"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["width"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["height"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["height"];
            annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationEnd"]["size"]["depth"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["depth"];

            let objectIndexNextFrame = getObjectIndexByTrackIdAndClass(annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["trackId"], annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["class"], newFileIndex);
            annotationObjects.__selectionIndexNextFrame = objectIndexNextFrame;
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["position"]["x"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["x"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["position"]["y"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["y"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["position"]["z"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["z"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["position"]["rotationY"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["rotationY"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["size"]["width"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["width"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["size"]["height"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["height"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationEnd"]["size"]["depth"] = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["depth"];

            // add start frame number
            let interpolationStartFileIndex = annotationObjects.contents[this.currentFileIndex][interpolationObjIndexCurrentFile]["interpolationStartFileIndex"];
            annotationObjects.contents[newFileIndex][objectIndexNextFrame]["interpolationStartFileIndex"] = interpolationStartFileIndex;
            folderPositionArray[objectIndexNextFrame].domElement.firstChild.firstChild.innerText = "Interpolation Start Position (frame " + (interpolationStartFileIndex + 1) + ")";
            folderSizeArray[objectIndexNextFrame].domElement.firstChild.firstChild.innerText = "Interpolation Start Size (frame " + (interpolationStartFileIndex + 1) + ")";

            // add end frame number
            if (interpolationStartFileIndex !== newFileIndex) {
                if (this.folderEndPosition !== undefined && this.folderEndSize !== undefined) {
                    this.folderEndPosition.domElement.firstChild.firstChild.innerText = "Interpolation End Position (frame " + (newFileIndex + 1) + ")";
                    this.folderEndSize.domElement.firstChild.firstChild.innerText = "Interpolation End Size (frame " + (newFileIndex + 1) + ")";
                }
                // enable button if selected mesh not undefined
                if (this.selectedMesh !== undefined) {
                    interpolateBtn.domElement.parentElement.parentElement.style.pointerEvents = "all";
                    interpolateBtn.domElement.parentElement.parentElement.style.opacity = 1.0;
                }
            }

        } else {
            if (annotationObjects.getSelectionIndex() !== -1 && annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()] !== undefined) {
                let objectIndexNextFrame = getObjectIndexByTrackIdAndClass(annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()]["trackId"], annotationObjects.contents[this.currentFileIndex][annotationObjects.getSelectionIndex()]["class"], newFileIndex);
                annotationObjects.__selectionIndexNextFrame = objectIndexNextFrame;
            }
        }

        this.previousFileIndex = this.currentFileIndex;
        // open folder of selected object
        if (selectionIndexNextFile !== -1) {
            // NOTE: set current file index after querying index above
            this.currentFileIndex = newFileIndex;
            interpolationObjIndexCurrentFile = interpolationObjIndexNextFile;
            annotationObjects.__selectionIndexCurrentFrame = annotationObjects.__selectionIndexNextFrame;
            this.selectedMesh = this.cubeArray[newFileIndex][selectionIndexNextFile];
            if (this.selectedMesh !== undefined) {
                addTransformControls();
            } else {
                labelTool.removeObject("transformControls");
            }
            let channels = annotationObjects.contents[newFileIndex][selectionIndexNextFile]["channels"];
            for (let channelIdx in channels) {
                if (channels.hasOwnProperty(channelIdx)) {
                    annotationObjects.select(selectionIndexNextFile, channels[channelIdx].channel);
                }
            }
        }
        this.currentFileIndex = newFileIndex;
        interpolationObjIndexCurrentFile = interpolationObjIndexNextFile;
        annotationObjects.__selectionIndexCurrentFrame = annotationObjects.__selectionIndexNextFrame;
        this.showData();

        // adjust panel height

    },

    addResizeEventForImage: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            // keepAspectRatio();
        });
    },

    addResizeEventForPCD: function () {
        $(window).unbind("resize");
        $(window).resize(function () {
            $(function () {
                if ($("#image-cam-front-left").css("display") === "block") {
                    let windowWidth = $('#label-tool-wrapper').width();
                    let width = windowWidth / 4 > 100 ? windowWidth / 4 : 100;
                    let height = width * 5 / 8;
                    // changeCanvasSize(width, height);
                }
            });
        });
    },

    resetBoxes: function () {
        for (let i = 0; i < annotationObjects.contents[this.currentFileIndex].length; i++) {
            let obj = annotationObjects.contents[this.currentFileIndex][i];
            let cubeObj = labelTool.cubeArray[this.currentFileIndex][i];
            if (obj["original"] !== undefined) {
                if (obj["original"]["class"] !== undefined) {
                    if (obj["class"] !== obj["original"]["class"]) {
                        obj["class"] = obj["original"]["class"];
                        // TODO: update color in 6 cam images and in BEV

                        if (labelTool.selectedMesh !== undefined) {
                            // TODO: update class in classpicker if selected object not undefined
                        }
                    }
                }
                if (obj["original"]["x"] !== undefined) {
                    obj["x"] = obj["original"]["x"];
                    cubeObj["position"]["x"] = obj["original"]["x"];
                }
                if (obj["original"]["y"] !== undefined) {
                    obj["y"] = obj["original"]["y"];
                    cubeObj["position"]["y"] = obj["original"]["y"];
                }
                if (obj["original"]["z"] !== undefined) {
                    obj["z"] = obj["original"]["z"];
                    cubeObj["position"]["z"] = obj["original"]["z"];
                }
                if (obj["original"]["length"] !== undefined) {
                    obj["length"] = obj["original"]["length"];
                    cubeObj["scale"]["y"] = obj["original"]["length"];
                }
                if (obj["original"]["width"] !== undefined) {
                    obj["width"] = obj["original"]["width"];
                    cubeObj["scale"]["x"] = obj["original"]["width"];
                }
                if (obj["original"]["depth"] !== undefined) {
                    obj["depth"] = obj["original"]["depth"];
                    cubeObj["scale"]["z"] = obj["original"]["depth"];
                }
                if (obj["original"]["rotationY"] !== undefined) {
                    obj["rotationY"] = obj["original"]["rotationY"];
                    cubeObj["rotation"]["z"] = obj["original"]["rotationY"];
                }
            }
        }
    },

// selectYes() {
//     $(function () {
//         $("#label-tool-dialogue-overlay").remove();
//     });
//     if (updateFlag)
//         return;
//     updateFlag = true;
//     document.getElementById("overlay-text").innerHTML = "Updating Database...";
//     $(function () {
//         $("#label-tool-status-overlay").fadeIn();
//     });
//     this.setAnnotations();
//     $.ajax({
//         url: '/labeling_tool/update_database/',
//         type: 'POST',
//         dataType: 'json',
//         data: {
//             images: this.fileNames.length,
//             label_id: this.labelId
//         },
//         complete: function (res) {
//             location.href = "label_select";
//         }.bind(this)
//     })
// },
//
// selectNo() {
//     $(function () {
//         $("#label-tool-dialogue-overlay").fadeOut();
//     });
// },


    handlePressKey: function (code, value) {
        if (code === 13) {
            this.jumpFrame();
        }
    }
};

function setImageSize() {
    // calculate the image width given the window width
    labelTool.imageSizes = {
        "LISA_T": {
            minWidthNormal: Math.round(window.innerWidth / 7.0),
            minHeightNormal: Math.round(window.innerWidth / (7.0 * 1.333)),
            maxWidthNormal: Math.round(2 * window.innerWidth / 7.0),
            maxHeightNormal: Math.round(2 * window.innerWidth / (7.0 * 1.333)),
            minWidthWide: Math.round(1.5 * window.innerWidth / 7.0),
            minHeightWide: Math.round(1.5 * window.innerWidth / (7.0 * 1.333)),
            maxWidthWide: Math.round(2 * 1.5 * window.innerWidth / 7.0),
            maxHeightWide: Math.round(2 * 1.5 * window.innerWidth / (7.0 * 1.333))
        },
        "NuScenes": {
            minWidthNormal: Math.floor(window.innerWidth / 6),
            minHeightNormal: Math.floor(window.innerWidth / (6 * 1.77778)),
            maxWidthNormal: 640,
            maxHeightNormal: 360
        }
    };
}

function setObjectParameters(annotationObj) {
    let params = {
        class: annotationObj["class"],
        x: annotationObj["x"],
        y: annotationObj["y"],
        z: annotationObj["z"],
        width: annotationObj["width"],
        height: annotationObj["height"],
        depth: annotationObj["depth"],
        rotationY: parseFloat(annotationObj["rotationY"]),
        channels: [{
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: ""
        }]
    };
    for (let i = 0; i < annotationObj["channels"].length; i++) {
        let channelObj = annotationObj["channels"][i];
        if (channelObj.channel !== undefined) {
            params["channels"][i]["channel"] = channelObj.channel;
        }
    }
    return params;
}

function getIndexByDimension(width, height, depth) {
    for (let obj in annotationObjects.contents[labelTool.currentFileIndex]) {
        let annotation = annotationObjects.contents[labelTool.currentFileIndex][obj];
        if (annotation.width === width && annotation.height === height && annotation.depth === depth) {
            return annotationObjects.contents[labelTool.currentFileIndex].indexOf(annotation);
        }
    }
    return -1;
}

function draw2DProjections(params) {
    for (let i = 0; i < params.channels.length; i++) {
        if (params.channels[i].channel !== undefined && params.channels[i].channel !== "") {
            // working for LISA_T
            //params.channels[i].projectedPoints = calculateProjectedBoundingBox(-params.x, -params.y, -params.z, params.width, params.height, params.depth, params.channels[i].channel, params.rotationY);
            params.channels[i].projectedPoints = calculateProjectedBoundingBox(params.x, params.y, params.z, params.width, params.height, params.depth, params.channels[i].channel, params.rotationY);
            // new transformation matrices
            // params.channels[i].projectedPoints = calculateProjectedBoundingBox(-params.x, -params.z, -params.y, params.width, params.depth, params.height, params.channels[i].channel, params.rotationY);

            // calculate line segments
            let channelObj = params.channels[i];
            if (params.channels[i].projectedPoints !== undefined && params.channels[i].projectedPoints.length === 8) {
                let horizontal = params.width > params.height;
                params.channels[i].lines = calculateAndDrawLineSegments(channelObj, params.class, horizontal);
            }
        }
    }
}

function numberToText(n) {
    if (n === 0) {
        return "";
    } else if (n <= 19) {
        let textNumbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        return textNumbers[n - 1];
    } else if (n <= 99) {
        let textNumbers = ["Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        let firstPart = textNumbers[Math.floor(n / 10) - 2];
        let secondPart = numberToText(n % 10);
        if (secondPart === "") {
            return firstPart;
        } else {
            return firstPart + "_" + secondPart;
        }
    } else if (n === 100) {
        return "HUNDRED";
    }
}

function setSequences() {
    for (let i = 1; i <= 100; i++) {
        let numberAsText = numberToText(i).toUpperCase();
        labelTool.sequencesNuScenes.push(numberAsText);
    }
}

function getDefaultObject() {
    let params = {
        class: "",
        x: -1,
        y: -1,
        z: -1,
        delta_x: 0,
        delta_y: 0,
        delta_z: 0,
        width: -1,
        height: -1,
        depth: -1,
        rotationY: -1,
        original: {
            x: -1,
            y: -1,
            z: -1,
            width: -1,
            height: -1,
            depth: -1,
            rotationY: -1
        },
        interpolationStartFileIndex: -1,
        interpolationStart: {
            position: {
                x: -1,
                y: -1,
                z: -1,
                rotationY: -1
            },
            size: {
                width: -1,
                height: -1,
                depth: -1
            }
        },
        interpolationEnd: {
            position: {
                x: -1,
                y: -1,
                z: -1,
                rotationY: -1
            },
            size: {
                width: -1,
                height: -1,
                depth: -1
            }
        },
        trackId: -1,
        channels: [{
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_FRONT_LEFT'
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_FRONT'
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_FRONT_RIGHT'
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_BACK_RIGHT'
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_BACK'
        }, {
            rect: [],
            projectedPoints: [],
            lines: [],
            channel: 'CAM_BACK_LEFT'
        }],
        fromFile: true,
        fileIndex: -1,
        copyLabelToNextFrame: false
    };
    return params;
}

function remove2DBoundingBoxes() {
    for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
        for (let j = 0; j < annotationObjects.contents[labelTool.currentFileIndex][i].channels.length; j++) {
            for (let k = 0; k < annotationObjects.contents[labelTool.currentFileIndex][i].channels[j].lines.length; k++) {
                let line = annotationObjects.contents[labelTool.currentFileIndex][i].channels[j].lines[k];
                if (line !== undefined) {
                    console.log("remove");
                    line.remove();
                }
            }
        }
    }
}

function initPanes() {
    let maxHeight;
    let minHeight;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
        minHeight = labelTool.imageSizes["LISA_T"]["minHeightNormal"];
        maxHeight = labelTool.imageSizes["LISA_T"]["maxHeightNormal"];
    } else {
        minHeight = labelTool.imageSizes["NuScenes"]["minHeightNormal"];
        maxHeight = labelTool.imageSizes["NuScenes"]["maxHeightNormal"];
    }

    let topStyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 0px;';
    $('#label-tool-wrapper').w2layout({
        name: 'layout',
        panels: [
            {type: 'top', size: minHeight, resizable: true, style: topStyle, minSize: minHeight, maxSize: maxHeight}
        ],
        onResizing: function (event) {
            let topElem = $("#layout_layout_panel_top")[0];
            let newImagePanelHeight = topElem.offsetHeight;
            let newWidth;
            let newWidthBackFront;
            if (labelTool.currentDataset === labelTool.datasets.LISA_T) {
                newWidth = newImagePanelHeight * labelTool.imageAspectRatioLISAT;
                newWidthBackFront = newImagePanelHeight * labelTool.imageAspectRatioFrontBackLISAT;
            } else {
                newWidth = newImagePanelHeight * labelTool.imageAspectRatioNuScenes;
            }
            if (newImagePanelHeight === 0 || newWidth === 0) {
                return;
            }
            for (let channelIdx in labelTool.camChannels) {
                if (labelTool.camChannels.hasOwnProperty(channelIdx)) {
                    let channelObj = labelTool.camChannels[channelIdx];
                    let channel = channelObj.channel;
                    if (labelTool.currentDataset === labelTool.datasets.LISA_T && (channel === "CAM_FRONT" || channel === "CAM_BACK")) {
                        changeCanvasSize(newWidthBackFront, newImagePanelHeight, channel);
                    } else {
                        changeCanvasSize(newWidth, newImagePanelHeight, channel);
                    }
                }
            }
            w2ui['layout'].set('top', {size: newImagePanelHeight});
            // adjust height of helper views
            let newCanvasHeight = (window.innerHeight - headerHeight - newImagePanelHeight) / 3;
            console.log(headerHeight + newImagePanelHeight);
            $("#canvasSideView").css("height", newCanvasHeight);
            $("#canvasSideView").css("top", headerHeight + newImagePanelHeight);
            views[1].height = newCanvasHeight;
            views[1].top = 0;
            $("#canvasFrontView").css("height", newCanvasHeight);
            $("#canvasFrontView").css("top", headerHeight + newImagePanelHeight + newCanvasHeight);
            views[2].height = newCanvasHeight;
            views[2].top = newCanvasHeight;
            $("#canvasBev").css("height", newCanvasHeight);
            $("#canvasBev").css("top", headerHeight + newImagePanelHeight + 2 * newCanvasHeight);
            views[3].height = newCanvasHeight;
            views[3].top = 2 * newCanvasHeight;
            // update camera of helper views
            for (let i = 1; i < views.length; i++) {
                let view = views[i];
                view.height = newCanvasHeight;
                let top = 4;
                let bottom = -4;
                let aspectRatio = view.width / view.height;
                let left = bottom * aspectRatio;
                let right = top * aspectRatio;
                let camera = view.camera;
                camera.left = left;
                camera.right = right;
                camera.top = top;
                camera.bottom = bottom;
                camera.updateProjectionMatrix();
            }
            // update projection of bounding boxes on camera images
            // delete all labels
            remove2DBoundingBoxes();
            // draw all labels
            for (let i = 0; i < annotationObjects.contents[labelTool.currentFileIndex].length; i++) {
                let annotationObj = annotationObjects.contents[labelTool.currentFileIndex][i];
                let params = setObjectParameters(annotationObj);
                draw2DProjections(params);
            }
            // update position of controls
            $("#bounding-box-3d-menu").css("top", headerHeight + newImagePanelHeight);
        },
        onRefresh: function (event) {
            console.log('object ' + event.target + ' is refreshed');
            event.onComplete = function () {
                $("#layout_layout_resizer_top").on('click', function () {
                    w2ui['layout'].resize();
                });
                $("#layout_layout_resizer_top").on('drag', function () {
                    w2ui['layout'].resize();
                });
            }
        }
    });
    w2ui['layout'].resizer = 10;
    w2ui['layout'].resize();
    w2ui['layout'].refresh();
}

$("#previous-frame-button").keyup(function (e) {
    if (e.which === 32) {
        return false;
    }
});

$("#next-frame-button").keyup(function (e) {
    if (e.which === 32) {
        return false;
    }
});

function calculateAndDrawLineSegments(channelObj, className, horizontal) {
    let channel = channelObj.channel;
    let lineArray = [];
    let channelIdx = getChannelIndexByName(channel);
    // temporary color bottom 4 lines in yellow to check if projection matrix is correct
    // let color = '#ffff00';
    // uncomment line to use yellow to color bottom 4 lines
    let color;
    if (labelTool.showOriginalNuScenesLabels === true && labelTool.currentDataset === labelTool.datasets.NuScenes) {
        let classIdx = classesBoundingBox.classNameArray.indexOf(className);
        color = classesBoundingBox.colorArray[classIdx];
    } else {
        color = classesBoundingBox[className].color;
    }

    let imageHeight = parseInt($("#layout_layout_resizer_top").css("top"), 10);
    let imageWidth;
    if (labelTool.currentDataset === labelTool.datasets.LISA_T && (channel === "CAM_FRONT" || channel === "CAM_BACK")) {
        imageWidth = imageHeight * labelTool.imageAspectRatioFrontBackLISAT;
    } else {
        imageWidth = imageHeight * labelTool.imageAspectRatioLISAT;
    }

    // bottom four lines
    if ((channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > imageWidth) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > imageHeight)
        && (channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > imageWidth) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > imageHeight)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[1], color));
    }
    if ((channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > imageWidth) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > imageHeight)
        && (channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > imageWidth) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > imageHeight)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[2], color));
    }
    if ((channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > imageWidth) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > imageHeight)
        && (channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > imageWidth) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > imageHeight)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[3], color));
    }
    if ((channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > imageWidth) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > imageHeight)
        && (channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > imageWidth) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > imageHeight)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[0], color));
    }


    // draw line for orientation
    // TODO: better draw filled polygon (transparent) like in scale.ai
    // let pointZero = channelObj.projectedPoints[0].clone();
    // let pointOne = channelObj.projectedPoints[1].clone();
    // let pointTwo = channelObj.projectedPoints[2].clone();
    // let pointThree = channelObj.projectedPoints[3].clone();

    let pointZero;
    let pointOne;
    let pointTwo;
    let pointThree;
    if (horizontal) {
        console.log("horizontal");
        // pointZero = channelObj.projectedPoints[3].clone();
        // pointOne = channelObj.projectedPoints[2].clone();
        // pointTwo = channelObj.projectedPoints[6].clone();
        // pointThree = channelObj.projectedPoints[7].clone();
        pointZero = channelObj.projectedPoints[4].clone();
        pointOne = channelObj.projectedPoints[5].clone();
        pointTwo = channelObj.projectedPoints[6].clone();
        pointThree = channelObj.projectedPoints[7].clone();
    } else {
        // pointZero = channelObj.projectedPoints[6].clone();
        // pointOne = channelObj.projectedPoints[2].clone();
        // pointTwo = channelObj.projectedPoints[3].clone();
        // pointThree = channelObj.projectedPoints[7].clone();
        pointZero = channelObj.projectedPoints[6].clone();
        pointOne = channelObj.projectedPoints[4].clone();
        pointTwo = channelObj.projectedPoints[5].clone();
        pointThree = channelObj.projectedPoints[7].clone();
    }


    let startPoint = pointZero.add(pointThree.sub(pointZero).multiplyScalar(0.5));
    // pointZero = channelObj.projectedPoints[0].clone();
    // pointThree = channelObj.projectedPoints[3].clone();
    let startPointCloned = startPoint.clone();
    let helperPoint = pointOne.add(pointTwo.sub(pointOne).multiplyScalar(0.5));
    let helperPointCloned = helperPoint.clone();
    let endPoint = startPointCloned.add(helperPointCloned.sub(startPointCloned).multiplyScalar(0.2));
    lineArray.push(getLine(channelIdx, startPoint, endPoint, color));


    // color = '#00ff00';
    // top four lines
    if ((channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)
        && (channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[4], channelObj.projectedPoints[5], color));
    }

    if ((channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)
        && (channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[5], channelObj.projectedPoints[6], color));
    }
    if ((channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)
        && (channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[6], channelObj.projectedPoints[7], color));
    }
    if ((channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)
        && (channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[7], channelObj.projectedPoints[4], color));
    }

    // vertical lines
    if ((channelObj.projectedPoints[0].x < 0 || channelObj.projectedPoints[0].x > 320) && (channelObj.projectedPoints[0].y < 0 || channelObj.projectedPoints[0].y > 240)
        && (channelObj.projectedPoints[4].x < 0 || channelObj.projectedPoints[4].x > 320) && (channelObj.projectedPoints[4].y < 0 || channelObj.projectedPoints[4].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[0], channelObj.projectedPoints[4], color));
    }
    if ((channelObj.projectedPoints[1].x < 0 || channelObj.projectedPoints[1].x > 320) && (channelObj.projectedPoints[1].y < 0 || channelObj.projectedPoints[1].y > 240)
        && (channelObj.projectedPoints[5].x < 0 || channelObj.projectedPoints[5].x > 320) && (channelObj.projectedPoints[5].y < 0 || channelObj.projectedPoints[5].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[1], channelObj.projectedPoints[5], color));
    }
    if ((channelObj.projectedPoints[2].x < 0 || channelObj.projectedPoints[2].x > 320) && (channelObj.projectedPoints[2].y < 0 || channelObj.projectedPoints[2].y > 240)
        && (channelObj.projectedPoints[6].x < 0 || channelObj.projectedPoints[6].x > 320) && (channelObj.projectedPoints[6].y < 0 || channelObj.projectedPoints[6].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[2], channelObj.projectedPoints[6], color));
    }
    if ((channelObj.projectedPoints[3].x < 0 || channelObj.projectedPoints[3].x > 320) && (channelObj.projectedPoints[3].y < 0 || channelObj.projectedPoints[3].y > 240)
        && (channelObj.projectedPoints[7].x < 0 || channelObj.projectedPoints[7].x > 320) && (channelObj.projectedPoints[7].y < 0 || channelObj.projectedPoints[7].y > 240)) {
        // continue with next line
    } else {
        lineArray.push(getLine(channelIdx, channelObj.projectedPoints[3], channelObj.projectedPoints[7], color));
    }

    return lineArray;
}

function takeScreenshot() {
    let imgData = renderer.domElement.toDataURL();
    labelTool.frameScreenshots.push(imgData);
}


function getZipVideoFrames() {
    let zip = new JSZip();
    // for (let i = 0; i < 899; i++) {
    for (let i = 0; i < 449; i++) {
        let substring = labelTool.frameScreenshots[i].substring(22, labelTool.frameScreenshots[i].length);
        let byteArray = Base64Binary.decodeArrayBuffer(substring);
        zip.file(pad(i, 6) + ".png", byteArray);
    }
    return zip;
}

function initTimer() {
    labelTool.timeElapsed = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let timeString = "";

    setInterval(function () {
        // increase elapsed time every second
        labelTool.timeElapsed = labelTool.timeElapsed + 1;
        seconds = labelTool.timeElapsed % 60;
        minutes = Math.floor(labelTool.timeElapsed / 60);
        if (minutes > 59) {
            minutes = 0;
        }
        hours = Math.floor(labelTool.timeElapsed / (60 * 60));
        timeString = pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
        $("#time-elapsed").text(timeString);
    }, labelTool.timeDelay);
}

function initScreenshotTimer() {
    labelTool.timeElapsedScreenshot = 0;
    let screenshotIntervalHandle = setInterval(function () {
        // increase elapsed time every second
        labelTool.timeElapsedScreenshot = labelTool.timeElapsedScreenshot + 1;
        // take screenshot every 2 seconds
        if (labelTool.takeCanvasScreenshot === true) {
            if (labelTool.currentFileIndex < 899) {
                // if (labelTool.currentFileIndex < 450) {
                takeScreenshot();
                labelTool.changeFrame(labelTool.currentFileIndex + 1);
            } else {
                labelTool.takeCanvasScreenshot = false;
                let zip = getZipVideoFrames();
                zip.generateAsync({type: "blob"})
                    .then(function (content) {
                        saveAs(content, labelTool.currentDataset + "_" + labelTool.currentSequence + '_video_frames.zip')
                    });
            }
        } else {
            clearInterval(screenshotIntervalHandle);
        }
    }, labelTool.timeDelayScreenshot);
}

function initPlayTimer() {
    labelTool.timeElapsedPlay = 0;
    let playIntervalHandle = setInterval(function () {
        labelTool.timeElapsedPlay = labelTool.timeElapsedPlay + 1;
        if (labelTool.playSequence === true) {
            if (labelTool.currentFileIndex < 900) {
                labelTool.changeFrame(labelTool.currentFileIndex + 1);
            } else {
                clearInterval(playIntervalHandle);
            }
        } else {
            clearInterval(playIntervalHandle);
        }

    }, labelTool.timeDelayPlay);
}

function initFrameSelector() {
    // add bar segments to frame selection bar
    for (let i = 0; i < labelTool.numFrames; i++) {
        let selectedClass = "";
        if (i === 0) {
            selectedClass = "selected";
        }
        let divElem = $("<div data-tip=" + i + " data-for=\"frame-selector\" class=\"frame default " + selectedClass + "\"></div>");
        $(divElem).on("click", function (item) {
            $("div.frame").attr("class", "frame default");
            item.target.className = "frame default selected";
            let elemIndex = Number(item.target.dataset.tip);
            labelTool.changeFrame(elemIndex);
        });
        $(".frame-selector__frames").append(divElem);

    }
}

function setPanelSize(newFileIndex) {
    let panelHeight = labelTool.imageSizes["LISA_T"]["minHeightNormal"];
    $("#layout_layout_panel_top").css("height", panelHeight);
    $("#layout_layout_resizer_top").css("top", panelHeight);
    $("#layout_layout_panel_main").css("top", panelHeight);
    $("#image-cam-front-left").css("height", panelHeight);
    $("#image-cam-front").css("height", panelHeight);
    $("#image-cam-front-right").css("height", panelHeight);
    $("#image-cam-back-right").css("height", panelHeight);
    $("#image-cam-back").css("height", panelHeight);
    $("#image-cam-back-left").css("height", panelHeight);


    for (let i = 0; i < labelTool.camChannels.length; i++) {
        let id = "#image-" + labelTool.camChannels[i].channel.toLowerCase().replace(/_/g, '-');
        // bring all svgs into background
        let allSvg = $(id + " svg");
        for (let j = 0; j < allSvg.length; j++) {
            allSvg[j].style.zIndex = 0;
        }
        allSvg[labelTool.numFrames - newFileIndex - 1].style.zIndex = 2;
        if (i === 1 || i === 4) {
            // back or front
            let imgWidth = 1.5 * window.innerWidth / 7;
            allSvg[labelTool.numFrames - newFileIndex - 1].style.width = imgWidth;
            allSvg[labelTool.numFrames - newFileIndex - 1].style.height = imgWidth / labelTool.imageAspectRatioFrontBackLISAT;
        } else {
            let imgWidth = window.innerWidth / 7;
            allSvg[labelTool.numFrames - newFileIndex - 1].style.width = imgWidth;
            allSvg[labelTool.numFrames - newFileIndex - 1].style.height = imgWidth / labelTool.imageAspectRatioLISAT;
        }
    }

}