import SurfacePattern from "./atomicPatterns/SurfacePattern";
import Joint from "./Joint";

/**
 * Superclass for joints that consist of / include cutouts in the surface of a segment
 */
export default abstract class SurfaceJoint extends Joint<SurfacePattern> {}
