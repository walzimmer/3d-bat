import numpy as np

#################
# S40 near
#################

intrinsic_matrix = np.array([[2.78886072e+03,   0.00000000e+00,   9.07839058e+02],
                            [0.00000000e+00,   2.78331261e+03,   5.89071478e+02],
                            [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[ 0.16281282,  0.21592079, -0.96274098],
                           [ 0.98651019, -0.05245554,  0.15506795],
                           [-0.0170187,  -0.97500083, -0.2215485 ]], dtype=float).T

translation_vector = np.array([ 455.90735878,  -14.77386387,    8.434     ], dtype=float)

# rotate the translation vector, then stack it
translation_vector_rotated = np.matmul(rotation_matrix, translation_vector)
extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[0:3, 0:3] = rotation_matrix
extrinsic_matrix[0:3, 3] = -translation_vector_rotated

# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print("projection matrix S40 near:",projection_matrix)

#################
# S40 far
#################

intrinsic_matrix = np.array( [[  9.02348282e+03,   0.00000000e+00,   1.22231430e+03],
                            [  0.00000000e+00,   9.01450436e+03,   5.57541182e+02],
                            [  0.00000000e+00,   0.00000000e+00,   1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[  7.54789063e-02,   5.62727716e-02,  -9.95558291e-01],
                           [  9.97141308e-01,  -7.69991457e-04,   7.55554009e-02],
                           [  3.48514044e-03,  -9.98415135e-01,  -5.61700232e-02]], dtype=float).T

translation_vector = np.array([ 465.72356842,  -14.60582418,    8.25], dtype=float)

# rotate the translation vector, then stack it
translation_vector_rotated = np.matmul(rotation_matrix, translation_vector)
extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[0:3, 0:3] = rotation_matrix
extrinsic_matrix[0:3, 3] = -translation_vector_rotated

# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print("projection matrix S40 far:",projection_matrix)


#################
# S50 near
#################
intrinsic_matrix = np.array([[2.82046004e+03, 0.00000000e+00, 9.60667182e+02],
                             [0.00000000e+00, 2.81622151e+03, 5.25863289e+02],
                             [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[-6.67942916e-04, -1.94233505e-01, 9.80955096e-01],
                            [-9.99986586e-01, 5.16816386e-03, 3.42417940e-04],
                            [-5.13624571e-03, -9.80941709e-01, -1.94234351e-01]], dtype=float).T

translation_vector = np.array([0.82720991e+00, -5.59124063e+00, 8.4336e+00], dtype=float)

# rotate the translation vector, then stack it
translation_vector_rotated = np.matmul(rotation_matrix, translation_vector)
extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[0:3, 0:3] = rotation_matrix
extrinsic_matrix[0:3, 3] = -translation_vector_rotated

# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print("projection matrix S50 near:",projection_matrix)
# [[ 9.40487461e+02 -2.82009326e+03 -2.01081142e+02  -1.48499626e+04]
#  [-3.11563016e+01  1.47347593e+01 -2.86468986e+03 2.42678068e+04]
#  [ 9.80955096e-01  3.42417940e-04 -1.94234351e-01 8.28553587e-01]]


#################
# S50 far
#################

intrinsic_matrix = np.array([[8.87857970e+03, 0.00000000e+00, 5.84217565e+02],
                            [0.00000000e+00, 8.81172402e+03, 4.65520403e+02],
                            [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[ 0.07011563, -0.05890341,  0.99579827],
                           [-0.99750083,  0.0045778,   0.0705063 ],
                           [-0.00871162, -0.99825319, -0.05843522]], dtype=float).T

translation_vector = np.array([0.80730991, -5.20124063, 8.2375], dtype=float)

# rotate the translation vector, then stack it
translation_vector_rotated = np.matmul(rotation_matrix, translation_vector)
extrinsic_matrix = np.zeros((3, 4))
extrinsic_matrix[0:3, 0:3] = rotation_matrix
extrinsic_matrix[0:3, 3] = -translation_vector_rotated

# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print("projection matrix S50 far:",projection_matrix)

#################
# S110
#################

intrinsic_matrix = np.array([[1029.2795655594014,0.0,982.0311857478633],
                                  [0.0,1122.2781391971948,1129.1480997238505],
                                  [0.0,0.0,1.0]], dtype=float)/2.0

extrinsic_matrix = np.array([
    [
      9.58895265e-01,
      -2.83760227e-01,
      -6.58645965e-05,
      1.41849928e00
    ],
    [
      2.83753514e-01,
      9.58874128e-01,
      -6.65957109e-03,
      -1.37385689e01
    ],
    [
      1.95287726e-03,
      6.36714187e-03,
      9.99977822e-01,
      3.87637894e-01
    ]
  ],dtype=float)




# 3x3 * 3x4 = 3x4
projection_matrix = np.matmul(intrinsic_matrix, extrinsic_matrix)
print("projection matrix s110_camera_basler_south2_8mm:",repr(projection_matrix))


