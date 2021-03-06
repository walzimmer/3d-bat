import numpy as np
from numpy.linalg import det
from numpy.linalg import inv
from scipy.linalg import rq


class Calibration:

    def P_to_KRt(self, P):
        '''

        This function computes the decomposition of the projection matrix into intrinsic parameters, K, and extrinsic parameters Q (the rotation matrix) and t (the translation vector)

        Usage:
        K, R, t = P_to_KRt(P)

        Input:
        P: 3x4 projection matrix

        Outputs:
        K: 3x3 camera intrinsics
        R: 3x3 rotation matrix (extrinsics)
        t: 3x1 translation vector(extrinsics)

        '''

        M = P[0:3, 0:3]

        R, Q = rq(M)

        K = R / float(R[2, 2])

        if K[0, 0] < 0:
            K[:, 0] = -1 * K[:, 0]
            Q[0, :] = -1 * Q[0, :]

        if K[1, 1] < 0:
            K[:, 1] = -1 * K[:, 1]
            Q[1, :] = -1 * Q[1, :]

        if det(Q) < 0:
            print('Warning: Determinant of the supposed rotation matrix is -1')

        P_3_3 = np.dot(K, Q)

        P_proper_scale = (P_3_3[0, 0] * P) / float(P[0, 0])

        t = np.dot(inv(K), P_proper_scale[:, 3])

        return K, Q, t


if __name__ == '__main__':
    calib = Calibration()
    P = np.array([[9.40487461e+02, -2.82009326e+03, -2.01081143e+02, -1.48499626e+04],
                  [-3.11563010e+01, 1.47347593e+01, -2.86468986e+03, 2.42678068e+04],
                  [9.80955096e-01, 3.42417940e-04, -1.94234351e-01, 8.28553591e-01]])

    K, R, t = calib.P_to_KRt(P)
    print("intrinsic matrix: ", K)
    print("rotation matrix: ", R)
    print("translation vector: ", t)
