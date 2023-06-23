from svgpathtools import *
import itertools

class EnhancedPath:
    def __init__(self, path, attributes):
        self.path = path 
        self.attributes = attributes
    
    def get_path(self):
        return self.path

    def get_attributes(self):
        return self.attributes

    def isclosed(self):
        # svgpathtools asserts isclosed instead of returning false for some reason
        try:
            self.path.isclosed()
        except AssertionError:
            return False

    def iscontinuous(self):
        return self.path.iscontinuous()

    def point(self, T): 
        return self.path.point(T)

    def bbox(self): 
        return self.path.bbox()

    def write_svg(self, filename):
        wsvg(self.path, attributes=self.attributes, filename=filename)

    def points(self): 
        points = []
        for segment in self.path: 
            points.append(segment.point(0))
        return points
    
    def segments(self):
        return [EnhancedPath(Path(segment), self.attributes) for segment in self.path]

class GroupedPath: 
    def __init__(self, enhanced_paths): 
        raw_paths = map(lambda x: x.get_path(), enhanced_paths)
        segments = []
        for path in raw_paths:
            for segment in path: 
                segments.append(segment)
        self.unified_path = Path(*segments)
        self.enhanced_paths = enhanced_paths

    def points(self):
        points = map(lambda x: x.points(), self.enhanced_paths)
        return list(itertools.chain(*points))

    def bbox(self): 
        return self.unified_path.bbox()

    def write_svg(self, filename):
        paths = list(map(lambda x: x.get_path(), self.enhanced_paths))
        attributes = list(map(lambda x: x.get_attributes(), self.enhanced_paths))
        wsvg(paths, attributes=attributes, filename=filename)

def consolidate_to_grouped(enhanced_paths_and_grouped_paths):
    paths = []
    for path in enhanced_paths_and_grouped_paths: 
        if isinstance(path, EnhancedPath):
            paths.append(path)
        elif isinstance(path, GroupedPath):
            paths += path.enhanced_paths

    return GroupedPath(paths)

to_preserve = [ "transform",
                "fill",
                "stroke",
                "stroke-width",
                "stroke-linecap",
                "stroke-linejoin",
                "stroke-miterlimit",
              ]

default_values = { "fill": "none",
                   "stroke": "#000000",
                   "stroke-width": 0.5,
                   "stroke-linecap": "round",
                   "stroke-linejoin": "round",
                   "stroke-miterlimit": 10
                 }

def read_svg(file): 
    paths, raw_attributes_per_path = svg2paths(file)
    attributes_per_path = []
    for raw_attributes in raw_attributes_per_path:
        attributes = {}
        for attr in raw_attributes: 
            if attr in to_preserve:
                attributes[attr] = raw_attributes[attr]
        for attr_name in default_values:
            if attr_name not in attributes: 
                attributes[attr_name] = default_values[attr_name]
        attributes_per_path.append(attributes)
    e_paths = []
    for p, attr in zip(paths, attributes_per_path): 
        e_paths.append(EnhancedPath(p, attr))
    return e_paths


