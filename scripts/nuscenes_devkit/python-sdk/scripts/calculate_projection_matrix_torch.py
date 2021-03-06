import torch

intrinsic_matrix = torch.tensor([[2.82046004e+03, 0.00000000e+00, 9.60667182e+02],
                                 [0.00000000e+00, 2.81622151e+03, 5.25863289e+02],
                                 [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]])

rotation_matrix = torch.tensor([[-6.67942916e-04, -1.94233505e-01, 9.80955096e-01],
                                [-9.99986586e-01, 5.16816386e-03, 3.42417940e-04],
                                [-5.13624571e-03, -9.80941709e-01, -1.94234351e-01]])

translation_vector = torch.tensor([0.82720991e+00, -5.59124063e+00, 8.4336e+00])

# 3x3 * 3x3 = 3x3
kr_matrix = torch.mm(intrinsic_matrix, rotation_matrix)

# 3x3 * 3x1 = 3x1
t = torch.mv(kr_matrix, translation_vector)

projection_matrix = torch.zeros((3, 4))
projection_matrix[0:3, 0:3] = kr_matrix
projection_matrix[0:3, 3] = -t

print(projection_matrix)
# tensor([[-6.8181e+00, -1.4902e+03,  2.5802e+03, -3.0086e+04],
#         [-2.8189e+03, -5.0129e+02, -1.0118e+02,  3.8228e+02],
#         [-5.1362e-03, -9.8094e-01, -1.9423e-01, -3.8423e+00]])


