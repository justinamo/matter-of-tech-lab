import * as standardDeviation from "standard-deviation";
import Segment from "../dataformat/Segment";
import Finger from "./atomicPatterns/Finger";
import FingerJointRecognizer from "./FingerJointRecognizer";
import Joint from "./Joint";
import OutlineJoint from "./OutlineJoint";

export default class FingerJoint extends OutlineJoint {

  /**
   * Uses [[FingerJointRecognizer]]
   */
  public static recognize(
    segment: Segment, materialThickness: number, precisionError: number, probabilityThreshold: number,
  ) {
    const recognizer = new FingerJointRecognizer(segment, materialThickness, precisionError, probabilityThreshold);
    return recognizer.recognize();
  }

  /**
   * @returns The number of fingers and cutouts in this finger joint
   */
  public getAtomicPatternCount() {
    return this.getAtomicPatterns().length;
  }

  /**
   * @return The total width of this finger joint (all cutouts and finger widths summed)
   */
  public getWidth() {
    let width = 0;
    for (const ap of this.getAtomicPatterns()) {
      width += ap.getWidth();
    }
    return width;
  }

  /**
   * @return Average depth of all fingers and cutouts in this finger joint
   */
  public getDepth() {
    let sum = 0;
    for (const ap of this.getAtomicPatterns()) {
      sum += ap.getDepth();
    }
    return sum / this.getAtomicPatterns().length;
  }

  /**
   * Calculate the probability of this being a finger joint.
   * Factors (with weight):
   * - average finger/cutout depth should equal material thickness (30%)
   * - finger/cutout depth should be (almost) constant (30%)
   * - finger/cutout width should be similar (20%)
   * - number of fingers/cutouts should be three or higher (20%)
   * @param materialThickness Known/guessed material thickness
   * @param precisionError The assumed precision error caused e.g. by drawing freehand
   * @returns Probability within [0, 1]
   */
  public getRecognitionProbability(materialThickness: number, precisionError: number) {
    let probabilityConstDepth;
    let probabilityFingerCount;
    let probabilityFingerDepth;
    let probabilitySimilarWidth;

    const depths = this.getAtomicPatterns().map(ap => ap.getDepth());
    const depthDeviation = standardDeviation(depths);

    const widths = this.getAtomicPatterns().map(ap => ap.getWidth());
    const widthDeviation = standardDeviation(widths);

    if (Math.abs(this.getDepth() - materialThickness) > precisionError) {
      return 0;
    } else if (precisionError === 0) {
      probabilityFingerDepth = 1;
    } else {
      // 1 if average finger and cutout depth equals material thickness
      // approaches 0 as the difference approaches the precision error
      probabilityFingerDepth = (precisionError - Math.abs(this.getDepth() - materialThickness)) / precisionError;
    }

    if (depthDeviation > precisionError) {
      return 0;
    } else if (precisionError === 0) {
      probabilityConstDepth = 1;
    } else {
      // 1 if fingers and cutouts have the same depth
      // approaches 0 as the standard deviation approaches the precision error
      probabilityConstDepth = (precisionError - depthDeviation) / precisionError;
    }

    const limit = precisionError * 5;
    if (widthDeviation > limit) {
      return 0;
    } else if (limit === 0) {
      probabilitySimilarWidth = 1;
    } else {
      // see above
      probabilitySimilarWidth = (limit - widthDeviation) / limit;
    }

    if (this.getAtomicPatternCount() >= 3) {
      probabilityFingerCount = 1;
    } else {
      // assume there's at least one finger
      probabilityFingerCount = this.getAtomicPatternCount() / 3;
    }

    return  (probabilityFingerDepth * 0.3) +
            (probabilityConstDepth * 0.3) +
            (probabilitySimilarWidth * 0.2) +
            (probabilityFingerCount * 0.2);
  }

  /**
   * Calculate the probability of this finger joint matching another finger joint
   * Right now, it only returns 1 or 0 (either matches or doesn't match)
   * @see Joint#getMatchingProbability
   */
  public getMatchingProbability(joint: FingerJoint, precisionError) {

    const length = this.getAtomicPatternCount();
    if (length !== joint.getAtomicPatternCount()) {
      return 0;
    }

    const firstHere = this.getAtomicPatterns()[0];
    const firstThere = joint.getAtomicPatterns()[length - 1];
    if (firstHere instanceof Finger === firstThere instanceof Finger) {
      return 0;
    }

    for (let i = 0; i < this.getAtomicPatterns().length; i++) {
      const ap = this.getAtomicPatterns()[i];
      if (Math.abs(ap.getWidth() - joint.getAtomicPatterns()[length - 1 - i].getWidth()) > precisionError) {
        return 0;
      }
    }

    return 1;
  }
}
