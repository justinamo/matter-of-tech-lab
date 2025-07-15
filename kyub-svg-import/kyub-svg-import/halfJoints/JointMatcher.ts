import {groupBy} from "lodash";
import Finger from "./atomicPatterns/Finger";
import CrossJoint from "./CrossJoint";
import FingerJoint from "./FingerJoint";
import Joint from "./Joint";
import TeeJoint from "./TeeJoint";

export default class JointMatcher {

  protected readonly jointGroups: Joint[][];

  protected readonly precisionError: number;

  protected readonly probabilityThreshold: number;

  /**
   * @param jointGroups
   *   Each element of jointGroups is a group of joints belonging to the same segment.
   *   Only joints in different groups will be matched to each other.
   * @param precisionError The accepted precision error caused e.g. by drawing freehand
   * @param probabilityThreshold
   *    The minimum probability that a match needs to have in order to be recognized
   */
  constructor(jointGroups: Joint[][], precisionError: number, probabilityThreshold: number) {
    this.jointGroups = jointGroups;
    this.precisionError = precisionError;
    this.probabilityThreshold = probabilityThreshold;
  }

  /**
   * Finds possible matches of joints of all types and adds them to each other's match list
   */
  public matchJoints() {
    const jointGroupsByType = this.jointGroups.map(group => this._groupJointsByType(group));

    for (let i = 0; i < jointGroupsByType.length - 1; i++) {
      const groupA = jointGroupsByType[i];
      for (let k = i + 1; k < jointGroupsByType.length; k++) {
        const groupB = jointGroupsByType[k];
        this._matchFingerJoints(groupA.fingerJoints, groupB.fingerJoints);
        this._matchCrossJoints(groupA.crossJoints, groupB.crossJoints);
        this._matchTeeJoints(groupA.teeJoints, groupB.fingerJoints);
        this._matchTeeJoints(groupB.teeJoints, groupA.fingerJoints);
      }
    }
  }

  private _groupJointsByType(group) {
    const fingerJoints = [];
    const crossJoints = [];
    const teeJoints = [];
    for (const joint of group) {
      if (joint instanceof FingerJoint) {
        fingerJoints.push(joint);
      } else if (joint instanceof CrossJoint) {
        crossJoints.push(joint);
      } else if (joint instanceof TeeJoint) {
        teeJoints.push(joint);
      }
    }
    return {
      crossJoints,
      fingerJoints,
      teeJoints,
    };
  }

  private _matchFingerJoints(fingerJointsA, fingerJointsB) {
    const bucketsA = groupBy(fingerJointsA, j => j.getAtomicPatternCount());
    const bucketsB = groupBy(fingerJointsB, j => j.getAtomicPatternCount());

    for (const key in bucketsA) {
      if (!bucketsA.hasOwnProperty(key)) { continue; }

      const bucket = bucketsA[key];
      if (bucketsB[key] != null) {
        this._matchJointsFromArrays(bucket, bucketsB[key]);
      }
    }
  }

  private _matchCrossJoints(crossJointsA, crossJointsB) {
    this._matchJointsFromArrays(crossJointsA, crossJointsB);
  }

  private _matchTeeJoints(teeJoints, fingerJoints) {

    const teeJointBuckets = groupBy(teeJoints, j => j.getAtomicPatternCount());

    const fingerJointBuckets = groupBy(fingerJoints, (j) => {
      const atomicPatternCount = j.getAtomicPatternCount();
      if ((atomicPatternCount % 2) === 0) {
        return -1;
      } else if (!(j.atomicPatterns[0] instanceof Finger)) {
        return -1;
      } else {
        const fingerCount = (atomicPatternCount + 1) / 2;
        return fingerCount;
      }
    });

    for (const key in teeJointBuckets) {
      if (!teeJointBuckets.hasOwnProperty(key)) { continue; }

      const bucket = teeJointBuckets[key];
      if (fingerJointBuckets[key] != null) {
        this._matchJointsFromArrays(bucket, fingerJointBuckets[key]);
      }
    }
  }

  private _matchJointsFromArrays(jointsA, jointsB) {
    for (const jointA of jointsA) {
      for (const jointB of jointsB) {
        if (jointA.getMatchingProbability(jointB, this.precisionError) >= this.probabilityThreshold) {
          jointA.addMatch(jointB);
          jointB.addMatch(jointA);
        }
      }
    }
  }

}
