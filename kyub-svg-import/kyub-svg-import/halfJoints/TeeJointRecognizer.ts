import {Line3, Vector3} from "three";
import TeeJointCutout from "./atomicPatterns/TeeJointCutout";
import JointRecognizer from "./JointRecognizer";
import TeeJoint from "./TeeJoint";

/**
 * All cutouts with the same orientation grouped together
 * See [[TeeJointRecognizer._groupCutouts]]
 */
interface ICutoutGroup {
  orientation: Vector3;
  cutouts: TeeJointCutout[];
}

/**
 * This class should only be used by [[TeeJoint]].
 * To recognize tee joints, use [[TeeJoint.recognize]]
 */
export default class TeeJointRecognizer extends JointRecognizer {

  public recognize() {
    const cutouts = TeeJointCutout.recognize(this.segment, this.precisionError, this.materialThickness);
    if (cutouts.length === 0) { return []; }

    const groups = this._groupCutouts(cutouts);

    const joints = [];
    for (const group of groups) {
      while (group.cutouts.length > 0) {
        const current = group.cutouts[0];

        const alignedCutouts = this._extractAlignedCutouts(current, group);
        const spaces = this._calculateSpacesBetweenCutouts(alignedCutouts);

        const usedCutouts = alignedCutouts.map(ac => ac.cutout);
        group.cutouts = group.cutouts.filter(c => usedCutouts.indexOf(c) === -1);

        joints.push(new TeeJoint(usedCutouts, spaces));
      }
    }

    return joints;
  }

  /**
   * sort cutouts by orientation, tolerance ca. 0.57 degrees (0.01 radians)
   */
  private _groupCutouts(cutouts: TeeJointCutout[]): ICutoutGroup[] {
    const groups = [];
    for (const cutout of cutouts) {
      for (const orientation of cutout.getOrientation()) {

        // put cutouts whose orientations are rotated by 3.14 radians (180 degrees) in the same group
        // and ensure the angle is positive (atan2 returns values within [-3.14, 3.14])
        const angle = Math.round(Math.atan2(orientation.y, orientation.x) * 100);
        const group = (angle + 314) % 314;

        if (groups[group] == null) {
          const groupOrientation = orientation.normalize();
          groupOrientation.x = Math.round(groupOrientation.x * 100) / 100;
          groupOrientation.y = Math.round(groupOrientation.y * 100) / 100;
          groups[group] = {orientation: groupOrientation, cutouts: []};
        }

        groups[group].cutouts.push(cutout);
      }
    }
    return groups.filter(elem => elem != null);
  }

  private _extractAlignedCutouts(current: TeeJointCutout, group: ICutoutGroup,
    ): Array<{cutout: TeeJointCutout, distance: number}> {

    const lineStart = current.getCenter().toVector();
    const lineEnd = lineStart.clone().add(group.orientation);
    const centerLine = new Line3(lineStart, lineEnd);

    const aligned = [];
    for (const c of group.cutouts) {
      const center = c.getCenter().toVector();
      const closestPoint = centerLine.closestPointToPoint(center, false, new Vector3());
      if (center.distanceTo(closestPoint) <= this.precisionError) {
        aligned.push({
          cutout: c,
          distance: centerLine.closestPointToPointParameter(c.getCenter().toVector(), false),
        });
      }
    }

    aligned.sort((a, b) => a.distance - b.distance);

    return aligned;
  }

  private _calculateSpacesBetweenCutouts(cutouts: Array<{cutout: TeeJointCutout, distance: number}>) {
    if (!(cutouts.length > 1)) {
      return [];
    }

    const spaces = [];
    for (let i = 0, end = cutouts.length - 2, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      const curr = cutouts[i];
      const next = cutouts[i + 1];
      spaces.push(next.distance - curr.distance - (next.cutout.getWidth() / 2) - (curr.cutout.getWidth() / 2));
    }

    return spaces;
  }
}
