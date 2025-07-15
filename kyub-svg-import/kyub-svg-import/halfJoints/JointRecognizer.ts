import Segment from "../dataformat/Segment";

/**
 * Base structure for helper classes that can be used by Joints to recognize themselves
 */
export default abstract class JointRecognizer {

  protected readonly segment: Segment;

  protected readonly materialThickness: number;

  protected readonly precisionError: number;

  protected readonly probabilityThreshold: number;

  /**
   * See [[Joint.recognize]]
   */
  constructor(segment: Segment, materialThickness: number, precisionError: number, probabilityThreshold: number) {
    this.segment = segment;
    this.materialThickness = materialThickness;
    this.precisionError = precisionError;
    this.probabilityThreshold = probabilityThreshold;
  }

}
