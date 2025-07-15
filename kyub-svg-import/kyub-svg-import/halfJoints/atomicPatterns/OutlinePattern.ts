import AtomicPattern from "./AtomicPattern";

/**
 * @abstract Superclass for all atomic patterns in the outline of a segment
 */
export default class OutlinePattern extends AtomicPattern {

  private readonly index: number;

  private readonly depth: number;

  /**
   * @param index see [[AtomicPattern.getIndex]]
   * @param width see [[OutlinePattern.getWidth]]
   * @param depth see [[OutlinePattern.getDepth]]
   */
  constructor(index: number, width: number, depth: number) {
    super(width);
    this.index = index;
    this.depth = depth;
  }

  /**
   * @returns The position in the surrounding outline
   */
  public getIndex() { return this.index; }

  /**
   * @returns The depth/length of the finger/cutout
   */
  public getDepth() { return this.depth; }
}
