import * as Clipper from "js-clipper";
import * as pointInPolygon from "point-in-polygon";

type ArrayPoint2 = [number, number];

interface IClipperPoint {
  X: number;
  Y: number;
}

export enum JoinType {
  ROUND = Clipper.JoinType.jtRound,
  MITER = Clipper.JoinType.jtMiter,
  SQUARE = Clipper.JoinType.jtSquare,
}

/**
 * Helper class that offers functions that operate on polygons (= array of points)
 * Always expects the points as arrays ([0, 1]) themselves
 */
export default class PolygonUtils {
  /**
   * Ensures the supplied polygon is CW, if it's not, reverses the array in place
   * @param polygon - array of points, each point being an [x, y] array
   */
  public static ensureCW(polygon: ArrayPoint2[]): ArrayPoint2[] {
    if (this.getDirection(polygon) !== "CW") {
      polygon.reverse();
    }
    return polygon;
  }

  /**
   * Ensures the supplied polygon is CW, if it's not, reverses the array in place
   * @param polygon - array of points, each point being an [x, y] array
   */
  public static ensureCCW(polygon: ArrayPoint2[]): ArrayPoint2[] {
    if (this.getDirection(polygon) !== "CCW") {
      polygon.reverse();
    }
    return polygon;
  }

  /**
   * Determines whether a point is in a polygon.
   * @param point - point to be tested as [x, y] array
   * @param polygon - array of points, each point being an [x, y] array
   */
  public static pointInPolygon(point: ArrayPoint2, polygon: ArrayPoint2[]): boolean {
    return pointInPolygon(point, polygon);
  }

  /**
   * Removes collinear points. Modifies the array given as argument.
   * @param array - the polygon defined as an array of points
   * @param epsilon
   */
  public static removeCollinearPoints(array: ArrayPoint2[], epsilon: number = 0.2) {
    if (array.length === 0) { return; }

    let i = 0;
    while (i < array.length) {
      // Get the next 3 points
      const p0 = array[(i + 0) % array.length];
      const p1 = array[(i + 1) % array.length];
      const p2 = array[(i + 2) % array.length];

      // Calculate steepness
      const m1 = (p1[1] - p0[1]) / (p1[0] - p0[0]);
      const m2 = (p2[1] - p1[1]) / (p2[0] - p1[0]);
      const steepnessCollinear = (m1 === m2) || (Math.abs(m1 - m2) < epsilon);

      // If all points are on one (or very similar y) coordinate, the steepness test fails
      // -> test for y-steepness as well
      const ym1 = (p1[0] - p0[0]) / (p1[1] - p0[1]);
      const ym2 = (p2[0] - p1[0]) / (p2[1] - p1[1]);
      const ySteepnessCollinear = (ym1 === ym2) || (Math.abs(ym1 - ym2) < epsilon);

      // Remove point if collinear
      if (steepnessCollinear || ySteepnessCollinear) {
        array.splice(((i + 1) % array.length), 1);
        // go back since there might be multiple collinear points in a row
        i--;
      }
      i++;
    }
  }

  /**
   * Removes consecutive points that have identical positions. Modifies the array given as argument.
   * @param array - the polygon defined as an array of points
   * @param epsilon
   */
  public static removeDuplicatePoints(array: ArrayPoint2[], epsilon: number = 0.2) {
    if (array.length === 0) { return; }

    for (let i = 0, end = array.length; i <= end; i++) {
      const p0 = array[(i + 0) % array.length];
      const p1 = array[(i + 1) % array.length];

      if (!p0 || !p1) { continue; }

      if (Math.sqrt(Math.pow((p0[0] - p1[0]), 2) + Math.pow((p0[1] - p1[1]), 2)) < epsilon) {
        array.splice((i % array.length), 1);
      }
    }
  }

  /**
   * @param polygon - array of points, each point being an [x, y] array
   * @return "CW" or "CCW" depending on the polygon's direction, null if polygon is empty
   */
  public static getDirection(polygon: ArrayPoint2[]): "CW" | "CCW" | null {
    if (polygon.length === 0) { return null; }

    // http://stackoverflow.com/a/1165943
    let sumOverEdge = 0;

    for (let i = 0, end = polygon.length; i < end; i++) {
      const p0 = polygon[i];
      const p1 = polygon[(i + 1) % polygon.length];
      sumOverEdge += (p1[0] - p0[0]) * (p1[1] + p0[1]);
    }

    if (sumOverEdge > 0) {
      return "CW";
    }
    return "CCW";
  }

  /**
   * Uses js-clipper library to offset a given polygon
   * @param polygon - array of points to be offset
   * @param offsetAmount - number to be used as offset delta.
   * @param joinType - set type of offset join
   * @param decimalPrecision - how accurate, i.e. how many decimals after the ., should be calculated
   *  Negative numbers shrink the polygon, positive numbers inflate the polygon
   * @return resulting offset paths as array of polygons. Notice that offset operations on a single polygon may
   *  result in multiple polygons or holes might "disappear"
   */
  public static offsetPolygon(polygon: ArrayPoint2[], offsetAmount: number, joinType: JoinType = JoinType.ROUND,
                              decimalPrecision: number = 2) {

    // js-clipper works with emulated integers
    // Need to scale floats to preserve decimals
    const scale = Math.pow(10, decimalPrecision);

    let path = polygon.map((point) => ({X: point[0], Y: point[1]}));
    Clipper.JS.ScaleUpPath(path, scale);
    // determines the strategy for offset, see following for more info
    // https://sourceforge.net/p/jsclipper/wiki/Home%206/#b-offsetting-paths
    const miterLimit = 2;
    const arcTolerance = 0.25;
    const clipperOffset = new Clipper.ClipperOffset(miterLimit, arcTolerance);

    clipperOffset.AddPath(
      path,
      joinType,
      Clipper.EndType.etClosedPolygon,
    );
    const offsetPaths = new Clipper.Paths();
    clipperOffset.Execute(offsetPaths, offsetAmount * scale);
    Clipper.JS.ScaleDownPaths(offsetPaths, scale);
    const results = [];
    for (path of offsetPaths) {
      polygon = path.map((edge) => [edge.X, edge.Y]);
      results.push(polygon);
    }
    return results;
  }

  /**
   * Return a copy of the given polygon where a safety margin is applied around every hole and the outline.
   * The result can be interpreted using the even odd rule (e.g. using the BundleOfOutlinesPolygon in editor).
   * Holes will be CW, outlines will be CCW
   * @param polygonOutlines
   * @param polygonHoles
   * @param distance
   * @param decimalPrecision
   * @param offsettingJoinType
   */
  public static insetPolygonBySafetyMargin(polygonOutlines: ArrayPoint2[][], polygonHoles: ArrayPoint2[][],
                                           distance: number, decimalPrecision: number = 2,
                                           offsettingJoinType: JoinType = JoinType.SQUARE): ArrayPoint2[][] {
    const scale = 10 ** decimalPrecision;
    const clipper = new Clipper.Clipper();

    const arrayPoint2ToJsClipperPoint = point => ({X: point[0], Y: point[1]});

    const subjectPaths: IClipperPoint[][] = polygonOutlines.map(
      polygonOutline => polygonOutline.map(arrayPoint2ToJsClipperPoint),
    );

    const clippingPaths: IClipperPoint[][] = polygonHoles.map(
      polygonHole => polygonHole.map(arrayPoint2ToJsClipperPoint),
    );

    Clipper.JS.ScaleUpPaths(subjectPaths, scale);
    Clipper.JS.ScaleUpPaths(clippingPaths, scale);

    // the params are irrelevant - see https://sourceforge.net/p/jsclipper/wiki/documentation/#clipperlibclipperoffset
    const clipperOffset = new Clipper.ClipperOffset(2.0, 0.25);

    clipperOffset.AddPaths(subjectPaths, offsettingJoinType, Clipper.EndType.etClosedPolygon);
    const offsetSubjectPaths = new Clipper.Paths();
    clipperOffset.Execute(offsetSubjectPaths, -distance * scale);

    clipperOffset.Clear();

    clipperOffset.AddPaths(clippingPaths, offsettingJoinType, Clipper.EndType.etClosedPolygon);
    const offsetClippingPaths = new Clipper.Paths();
    clipperOffset.Execute(offsetClippingPaths, distance * scale);

    clipper.AddPaths(offsetSubjectPaths, Clipper.PolyType.ptSubject, true);
    clipper.AddPaths(offsetClippingPaths, Clipper.PolyType.ptClip, true);

    const clippingSolutionPaths: Array<Array<{X: number; Y: number}>> = [];
    const succeeded = clipper.Execute(
      Clipper.ClipType.ctDifference,
      clippingSolutionPaths,
      Clipper.ClipType.ctDifference,
      Clipper.PolyFillType.pftEvenOdd,
    );

    if (!succeeded) {
      throw new Error("Local polygon clipping in SafeMarginGeometryStep failed.");
    }

    Clipper.JS.ScaleDownPaths(clippingSolutionPaths, scale);

    const results: ArrayPoint2[][] = [];
    for (const path of clippingSolutionPaths) {
      results.push(path.map(edge => [edge.X, edge.Y]));
    }

    return results;
  }
}
