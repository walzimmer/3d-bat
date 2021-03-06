import numpy as np

intrinsic_matrix = np.array([[2.82046004e+03, 0.00000000e+00, 9.60667182e+02],
                             [0.00000000e+00, 2.81622151e+03, 5.25863289e+02],
                             [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]], dtype=float)

rotation_matrix = np.array([[-6.67942916e-04, -1.94233505e-01, 9.80955096e-01],
                            [-9.99986586e-01, 5.16816386e-03, 3.42417940e-04],
                            [-5.13624571e-03, -9.80941709e-01, -1.94234351e-01]], dtype=float)

translation_vector = np.array([0.82720991e+00, -5.59124063e+00, 8.4336e+00]).T

# matmul
# - multiplication by scalars is not allowed
# - stacks of matrices (n dim > 2) are broadcast together as if the matrices were elements

# dot
# - is equivalent for 2D arrays

# 3x3 * 3x3 = 3x3
kr_matrix = np.matmul(intrinsic_matrix, rotation_matrix)

# 3x3 * 3x1 = 3x1
t = np.matmul(kr_matrix, translation_vector)

projection_matrix = np.zeros((3, 4))
projection_matrix[0:3, 0:3] = kr_matrix
projection_matrix[0:3, 3] = -t
# print(projection_matrix)
# [[-6.81812900e+00 -1.49018635e+03  2.58015008e+03  1.04349952e+04]
#  [-2.81888470e+03 -5.01286539e+02 -1.01176390e+02 -1.13112515e+04]
#  [-5.13624571e-03 -9.80941709e-01 -1.94234351e-01  8.43360000e+00]]


print(projection_matrix)