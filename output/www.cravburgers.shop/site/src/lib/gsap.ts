// GSAP + plugin registration — mirrors the original's registrations in its chunks.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(
  ScrollTrigger,
  MotionPathPlugin,
  MorphSVGPlugin,
  InertiaPlugin,
  ScrollToPlugin,
  SplitText,
);

export { gsap, ScrollTrigger, MotionPathPlugin, MorphSVGPlugin, InertiaPlugin, ScrollToPlugin, SplitText };
