import LineStrip from "../dataformat/LineStrip";
import Segment from "../dataformat/Segment";
import OutlinePattern from "./atomicPatterns/OutlinePattern";
import Joint from "./Joint";

/**
 * Superclass for all joints in the outline of a segment
 */
export default abstract class OutlineJoint extends Joint<OutlinePattern> {

  private readonly segment: Segment;

  private readonly outline: LineStrip;

  private readonly index: number;

  /**
   * @param atomicPatterns
   *   An array containing all atomic patterns that make up this joint, sorted by their index.
   * @param segment The segment containing this joint
   */
  constructor(atomicPatterns: OutlinePattern[], segment: Segment) {
    super(atomicPatterns);
    this.segment = segment;
    this.outline = this.segment.getOutline();
    this.index = this.getAtomicPatterns()[0].getIndex();
  }

  public getIndex() {
    return this.index;
  }

  protected getOutline() {
    return this.outline;
  }

  protected getSegment() {
    return this.segment;
  }
}
