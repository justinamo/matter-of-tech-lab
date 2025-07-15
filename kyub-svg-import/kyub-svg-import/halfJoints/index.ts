import Segment from "../dataformat/Segment";
import CrossJoint from "./CrossJoint";
import FingerJoint from "./FingerJoint";
import Joint from "./Joint";
import JointMatcher from "./JointMatcher";
import TeeJoint from "./TeeJoint";

const availableJointClasses = [
  FingerJoint,
  CrossJoint,
  TeeJoint
];

/*
 * Detects the joints for all given segments. Adds a container.joints array.
 * @param segmentContainers The segments to search
 * @param materialThickness Known/guessed material thickness
 * @param precisionError The assumed precision error caused e.g. by drawing freehand
 * @param probabilityThreshold
 *    The minimum probability that a match needs to have in order to be recognized as a joint
 */
export const detectJoints = (
  segmentContainers: Array<{joints?: Joint[], segment: Segment}>,
  materialThickness: number,
  precisionError: number,
  probabilityThreshold: number,
) => {

  for (const c of segmentContainers) {
    c.joints = [];
    for (const jointClass of availableJointClasses) {
      const newJoints = jointClass.recognize(c.segment, materialThickness, precisionError, probabilityThreshold);
      c.joints = c.joints.concat(newJoints);
    }
  }
};

/*
 * Finds possible matches for the given joints
 * See [[JointMatcher]]
 */
export const matchJoints = (joints: Joint[][], precisionError: number, probabilityThreshold: number) => {
  const matcher = new JointMatcher(joints, precisionError, probabilityThreshold);
  matcher.matchJoints();
};
