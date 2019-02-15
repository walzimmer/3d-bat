import matplotlib.pyplot as plt
import numpy as np

plt.axis([1, 301, 1, 301])
plt.ylabel('precision')
plt.xlabel('frame')
plt.title('Precision')
x_values = np.asarray(np.arange(1, 301, 1))
y_values = np.asarray(np.arange(1, 301, 1))
plt.plot(x_values, y_values, '#ff0000')
plt.show()
