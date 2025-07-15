import Segment from "../../dataformat/Segment";

/**
 * Superclass for all atomic patterns
 */
export default abstract class AtomicPattern {

  /**
   * Searches for all occurrences of this pattern in the specified segment
   * @param segment The segment to search
   * @param precisionError The assumed precision error caused e.g. by drawing freehand
   * @param materialThickness known/guessed material thickness
   * @return All recognized occurrences in the segment
   */
  public static recognize(segment: Segment, precisionError: number, materialThickness: number): AtomicPattern[] {
    throw new Error("AtomicPattern can't be searched for as it is abstract, use subclasses instead");
  }

  private width: number;

  /**
   * @param width See [[AtomicPattern.getWidth]]
   */
  protected constructor(width: number) {
    this.width = width;
  }

  /**
   * @returns the width of the pattern
   */
  public getWidth() { return this.width; }

}
