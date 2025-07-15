import Point from "../../dataformat/Point";
import AtomicPattern from "./AtomicPattern";

/**
 * Superclass for all atomic patterns (cutouts) on the surface of a segment
 */
export default abstract class SurfacePattern extends AtomicPattern {

  private readonly center: Point;

  /**
   * @param center see [[SurfacePattern.getCenter]]
   * @param width see [[AtomicPattern.getWidth]]
   */
  constructor(center: Point, width) {
    super(width);
    this.center = center;
  }

  /**
   * @returns The center of the cutout
   */
  public getCenter() { return this.center; }
}
