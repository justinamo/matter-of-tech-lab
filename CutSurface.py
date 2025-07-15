import EnhancedPath

class CutSurface:
    def __init__(self, cuts, viewbox, surface_img, 
            svg_coordinate_units_per_measurement_unit, surface_pixels_per_measurement_unit):
        self.cuts = cuts
        self.surface_img = surface_img
        self.svg_coordinate_units_per_measurement_unit = svg_coordinate_units_per_measurement_unit
        self.surface_pixels_per_measurement_unit = surface_pixels_per_measurement_unit
        self.noncuttable_regions = find_notable_regions(self.find_noncuttable_regions())

    def translate_image_to_svg_coordinates(self):
        
        
        
    def traverse_image(self, i, j, pixels_to_region, region_number): 
        if self.surface_img[i][j] == 0: 
            if (i, j) not in pixels_to_region:
                pixels_to_region[(i, j)] = region_number
                self.traverse_image(i-1, j-1, pixels_to_region, region_number) 
                self.traverse_image(i-1, j, pixels_to_region, region_number) 
                self.traverse_image(i-1, j+1, pixels_to_region, region_number) 
                self.traverse_image(i, j-1, pixels_to_region, region_number) 
                self.traverse_image(i, j+1, pixels_to_region, region_number) 
                self.traverse_image(i+1, j-1, pixels_to_region, region_number) 
                self.traverse_image(i+1, j, pixels_to_region, region_number) 
                self.traverse_image(i+1, j+1, pixels_to_region, region_number) 
            return region_number + 1
        return region_number 

    def find_noncuttable_regions(self):
        height, width = self.surface_img.shape

        pixels_to_region = {}
        region_number = 1
        for i in range(height): 
            for j in range(width):
                region_number = self.traverse_image(i, j, pixels_to_region, region_number)

        regions = {}
        for point in pixels_to_region: 
            number = pixels_to_region[point]
            if number in regions: 
                regions[number].append(point)
            else:
                regions[number] = [point]

        return regions
    
    def get_bbox(region): 
        min_i = min(region, key=lambda x: x[0])
        max_i = max(region, key=lambda x: x[0])
        min_j = min(region, key=lambda x: x[1])
        max_j = max(region, key=lambda x: x[1])
        return min_i, max_i, min_j, max_j

    def find_notable_regions(noncuttable_regions):
        to_keep = []
        for number in noncuttable_regions: 
            region = noncuttable_regions[number]
            min_i, max_i, min_j, max_j = get_bbox(region) 
            rheight = max_i - min_i
            rwidth = max_j - min_j
            if rheight > threshold or rwidth > threshold: 
                to_keep.append(number)
            else: 
                del noncuttable_regions[number]
        return noncuttable_regions.values()

    def draw_polygon(region): 
        min_i, max_i, min_j, max_j = get_bbox(region) 
