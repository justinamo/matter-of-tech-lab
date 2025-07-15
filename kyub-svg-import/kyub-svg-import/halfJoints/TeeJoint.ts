import Segment from "../dataformat/Segment";
import Finger from "./atomicPatterns/Finger";
import SurfaceJoint from "./SurfaceJoint";
import TeeJointRecognizer from "./TeeJointRecognizer";

/**
 * an entire TeeJoint consists of a finger joint and one of these
 */
export default class TeeJoint extends SurfaceJoint {

  /**
   * Uses [[TeeJointRecognizer]]
   */
  public static recognize(
    segment: Segment, materialThickness: number, precisionError: number, probabilityThreshold: number,
  ) {
    const recognizer = new TeeJointRecognizer(segment, materialThickness, precisionError, probabilityThreshold);
    return recognizer.recognize();
  }

  private readonly spaces: number[];

  /**
   * @param atomicPatterns See [[Joint.constructor]]
   * @param spaces
   *   Array of the distances between the cutouts, e.g. spaces[0] is the distance
   *   between atomicPatterns[0] and atomicPatterns[1]
   */
  constructor(atomicPatterns, spaces: number[]) {
    super(atomicPatterns);
    this.spaces = spaces;
  }

  /**
   * @returns The number of cutouts in this tee joint
   */
  public getAtomicPatternCount() { return this.getAtomicPatterns().length; }

  /**
   * @returns The total width of this tee joint (from left edge of first cutout to right edge of last cutout)
   */
  public getWidth() {
    let width = 0;
    for (const ap of this.getAtomicPatterns()) {
      width += ap.getWidth();
    }
    for (const space of this.spaces) {
      width += space;
    }
    return width;
  }

  /**
   * See [[Joint.getMatchingProbability]]
   * Right now, it only returns 1 or 0 (either matches or doesn't match)
   */
  public getMatchingProbability(fingerJoint, precisionError) {
    const widths = [];
    for (let i = 0; i < this.getAtomicPatterns().length; i++) {
      const cutout = this.getAtomicPatterns()[i];
      widths.push(cutout.getWidth());
      if (i < this.spaces.length) { widths.push(this.spaces[i]); }
    }

    const fingerJointPatterns = fingerJoint.atomicPatterns;

    if ((widths.length !== fingerJointPatterns.length) || !(fingerJointPatterns[0] instanceof Finger)) {
      return 0;
    }

    const matchesWidths = this._matchWidths(fingerJointPatterns, widths, precisionError);
    widths.reverse();
    const matchesReversedWidths = this._matchWidths(fingerJointPatterns, widths, precisionError);

    if (matchesWidths || matchesReversedWidths) {
      return 1;
    } else {
      return 0;
    }
  }

  public getRecognitionProbability(materialThickness: number, precisionError: number): number {
    throw new Error("Not implemented yet");
  }

  private _matchWidths(fingerJointPatterns, widths, precisionError) {
    for (let i = 0; i < fingerJointPatterns.length; i++) {
      const pattern = fingerJointPatterns[i];
      if (Math.abs(pattern.width - widths[i]) > precisionError) {
        return false;
      }
    }
    return true;
  }
}
