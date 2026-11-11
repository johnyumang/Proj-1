/**
 * GSAP and its plugins, registered once for the whole page.
 * Native scrolling is kept; smoothness comes from the scrub value of each chapter.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// The address bar of mobile browsers resizes the window while scrolling; chapter heights use
// small-viewport units, so there is nothing to recalculate.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };
