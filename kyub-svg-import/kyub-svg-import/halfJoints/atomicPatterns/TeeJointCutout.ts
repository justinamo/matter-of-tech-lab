import {Vector3} from "three";
import LineStrip from "../../dataformat/LineStrip";
import Point from "../../dataformat/Point";
import Segment from "../../dataformat/Segment";
import TurtleGraphic from "../turtleGraphic/TurtleGraphic";
import GeometryUtils from "../utils/GeometryUtils";
import SurfacePattern from "./SurfacePattern";

/**
 * Every instance of this class represents a rectangular tee joint cutout in the surface of a segment
 * with its center point (average of coordinates), width (length of the side that doesn't equal material thickness)
 * and orientation (the direction of the width side)
 */
export default class TeeJointCutout extends SurfacePattern {

  public static recognize(segment: Segment, precisionError: number, materialThickness: number): TeeJointCutout[] {

    const cutouts = segment.getCutouts();

    const matches = [];
    for (const cutout of cutouts) {
      let startsWithWidth;
      const turtle = new TurtleGraphic(cutout);
      if (turtle.toString(false) !== "RRRR") { continue; }

      const edges = cutout.toLineArray();

      let width = 0;
      const orientation = [];
      let match = false;
      if (Math.abs(edges[0].getLength() - materialThickness) < precisionError) {
        width = edges[1].getLength();
        startsWithWidth = false;
        orientation.push(edges[1].toVector());
        match = true;
      }
      if (Math.abs(edges[1].getLength() - materialThickness) < precisionError) {
        width = edges[0].getLength();
        startsWithWidth = true;
        orientation.push(edges[0].toVector());
        match = true;
      }

      if (match === false) { continue; }

      // only calculate average of first four points since the fifth equals the first
      const center = GeometryUtils.findCenterPoint(cutout.getPoints().slice(0, 4));

      if (startsWithWidth !== true) {
        // rotate the array backwards by one element so that the first line is the width of the cutout
        // this is a little complicated since first and last point are equal
        let points = cutout.getPoints();
        points.splice(4, 1);
        points = points.concat([points[0], points[1]]);
        points.splice(0, 1);
        cutout.setPoints(points);
      }

      matches.push(new TeeJointCutout(center, width, orientation, cutout));
    }

    return matches;
  }

  private readonly orientation: Vector3[];

  private readonly lineStrip: LineStrip;

  /**
   * @param center see [[SurfacePattern.getCenter]]
   * @param width see [[AtomicPattern.getWidth]]
   * @param orientation see [[TeeJointCutout.getOrientation]]
   * @param lineStrip
   *   The line strip that forms the cutout. It needs to be clockwise
   *   and should start with the long side (width side / not material thickness)
   */
  constructor(center: Point, width: number, orientation: Vector3[], lineStrip) {
    super(center, width);
    this.orientation = orientation;
    this.lineStrip = lineStrip;
  }

  /**
   * @returns
   *   The orientation of the width side of the cutout.
   *   If the cutout is a square, it contains the orientation vectors of both sides
   */
  public getOrientation() { return this.orientation; }

  /**
   * the return value of this function is displayed by console.log
   */
  public inspect(depth) {
    return {
      center: this.getCenter().toArray(),
      orientation: this.orientation,
      width: this.getWidth(),
    };
  }
}
