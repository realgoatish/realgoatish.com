
/**
 * Detect if a browser supports a CSS property/value combo
 * @param {string} property
 * @param {string} value
 * @returns {boolean}
*/ 
export function isDeclarationSupported (property, value) {
  let prop = property + ':',
    el = document.createElement('test'),
    mStyle = el.style
  el.style.cssText = prop + value
  return mStyle[property]
}