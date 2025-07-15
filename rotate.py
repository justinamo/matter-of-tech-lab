import cv2, sys
from scipy.ndimage import rotate

img_path = sys.argv[1]
print(img_path)
img = cv2.imread(img_path)
print(img.shape)
landscape = rotate(img, 90)
write_location = "rotated_" + img_path
print(write_location);
cv2.imwrite(write_location, landscape)

