import Segment from "../dataformat/Segment";
import CrossJointRecognizer from "./CrossJointRecognizer";
import OutlineJoint from "./OutlineJoint";
import GeometryUtils from "./utils/GeometryUtils";

export default class CrossJoint extends OutlineJoint {

  /**
   * Uses [[CrossJointRecognizer]]
   */
  public static recognize(
    segment: Segment, materialThickness: number, precisionError: number, probabilityThreshold: number,
  ) {
    const recognizer = new CrossJointRecognizer(segment, materialThickness, precisionError, probabilityThreshold);
    return recognizer.recognize();
  }

  /**
   * @return Width of the cutout that constitutes this cross joint
   */
  public getWidth() { return this.getAtomicPatterns()[0].getWidth(); }

  /**
   * @return Depth of the cutout that constitutes this cross joint
   */
  public getDepth() { return this.getAtomicPatterns()[0].getDepth(); }

  /**
   * Calculate the probability of this being a cross joint.
   * Factors (with weight):
   * - width of cutout should equal material thickness (50%)
   * - depth of cutout should be much greater than material thickness (50%)
   */
  public getRecognitionProbability(materialThickness, precisionError) {
    let pDepth: number;
    let pWidthEqMaterial: number;

    if ((materialThickness == null) || (materialThickness === 0)) {
      throw new Error("getRecognitionProbability does't work without material thickness!");
    }

    if (Math.abs(this.getWidth() - materialThickness) > precisionError) {
      return 0;
    } else if (precisionError === 0) {
      pWidthEqMaterial = this.getWidth() === materialThickness ? 1 : 0;
    } else {
      // 1 if cutout width equals material thickness
      // approaches 0 as the difference approaches the precision error
      pWidthEqMaterial = (precisionError - Math.abs(this.getWidth() - materialThickness)) / precisionError;
    }

    // 1 if cutout depth is greater than five times material thickness,
    // approaches 0 as depth approaches 0
    if ((this.getDepth() / materialThickness) >= 5) {
      pDepth = 1;
    } else {
      pDepth = this.getDepth() / (materialThickness * 5);
    }

    return  (pWidthEqMaterial * 0.5) +
            (pDepth * 0.5);
  }

  /**
   * Calculate the probability of this cross joint matching another cross joint
   * Factors (with weight):
   * - depth of joints should be similar (30%)
   * - depth behind one cutout should equal depth of the other (50%)
   * - all cross joints kind of fit together (20%)
   * @param joint The other joint to match against
   * @param precisionError The accepted precision error caused e.g. by drawing freehand
   * @return Probability within [0, 1]
   */
  public getMatchingProbability(joint: CrossJoint, precisionError: number) {
    const depthHere = this.getDepth();
    const depthThere = joint.getDepth();

    const depthSum = depthHere + depthThere;
    const pSimilarDepth = (depthSum - Math.abs(depthHere - depthThere)) / depthSum;

    const pDepthBehind1 = 1 - (Math.abs(depthHere - joint.getDepthBehind()) / depthHere);
    const pDepthBehind2 = 1 - (Math.abs(depthThere - this.getDepthBehind()) / depthThere);
    if ((pDepthBehind1 < 0) || (pDepthBehind2 < 0)) {
      return 0;
    }
    const pDepthBehind = (pDepthBehind1 + pDepthBehind2) / 2;

    const pBasicMatch = 1;

    return (pSimilarDepth * 0.3) +
           (pDepthBehind * 0.5) +
           (pBasicMatch * 0.2);
  }

  /**
   * @return
   *   depth behind the cross joint. If there are cutouts in the surface
   *   behind the cross joint, the distance to the closest one will be found.
   *    _______________________        __________________________________
   *   |                       |      |                                  |
   *   |_______                |      |________        _____       ______|
   *    _______| <---------->  |       ________| <--> |_____|     |______
   *   |                       |      |                                  |
   *   |_______________________|      |__________________________________|
   *
   */
  public getDepthBehind(): number {
    const points = this.getOutline().getPoints().slice(0, -1);
    const originPoint = GeometryUtils.findCenterPoint([
      points[this.getIndex()],
      points[(this.getIndex() + 3) % points.length],
    ]);
    const directionPoint = GeometryUtils.findCenterPoint([
      points[(this.getIndex() + 1) % points.length],
      points[(this.getIndex() + 2) % points.length],
    ]);

    let minDepth = GeometryUtils.raycastLineStrip(originPoint, directionPoint, this.getOutline());
    for (const cutout of this.getSegment().getCutouts()) {
      const distanceToCutout = GeometryUtils.raycastLineStrip(originPoint, directionPoint, cutout);
      if ((distanceToCutout > 0) && (distanceToCutout < minDepth)) {
        minDepth = distanceToCutout;
      }
    }

    return minDepth - this.getDepth();
  }
}
