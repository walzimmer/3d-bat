import numpy as np

x = np.array([9, 5]).T
i = np.array([[3, 0],
              [2, 7]])
e = np.array([[1, 6],
              [4, 8]])
p = np.dot(i, e)
y_1 = np.dot(p, x)
print(y_1)

a = np.dot(e, x)
y_2 = np.dot(i, a)
print(y_2)