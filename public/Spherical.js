export const spherical = (() => {
  class Spherical {
    constructor() {
      this.r = Math.sqrt(x*x + y*y + z*z);
      this.theta = Math.atan2( Math.sqrt(x*x+y*y), z);
      this.phi = Math.atan2(y, x);
    }
  }

  return {
    Spherical: Spherical,
};
})();