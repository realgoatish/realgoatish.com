
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

/**
 * Filter an array of image objects to output one with only allowed keys
 * @param {Array.<{}>} arrayOfImageObjects
 * @returns {Array.<{format: string, width: (string|number), height: (string|number), src: string}>}
*/
export function filterArrayOfImageObjects (arrayOfImageObjects) {
  let newArr = []

  const allowed = ['format', 'width', 'height', 'src'];

  for (const imageObject of arrayOfImageObjects) {


    let filtered = Object.fromEntries(
      Object.entries(imageObject).filter(
        ([key, val]) => allowed.includes(key)
      )
    )
    filtered.src = filtered.src.replace('/', 'http://localhost:3000/')
    newArr.push(filtered)
  }

  /**
   * @type {Array.<{format: string, width: (string|number), height: (string|number), src: string}>}
   */
  /* @ts-ignore */
  // let webpsOnly = newArr.filter(x => x.format === 'webp')
  // webpsOnly.reverse()

  // return webpsOnly
  newArr.reverse()

  return newArr
}
