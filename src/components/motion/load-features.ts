/**
 * Motion's animation features are about 45 KB gzipped. They load as a separate chunk after the page
 * is interactive, so they are not part of the first paint. Until they arrive, animated elements
 * simply stay in their initial state (the noscript rule in the layout covers browsers without
 * JavaScript).
 */
export const loadMotionFeatures = () => import('./features').then((module) => module.default)
