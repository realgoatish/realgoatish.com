import fs from 'fs'

let svgspriteContent = fs.readFileSync('static/svg/sprite/sprite.svg', 'utf-8')

let sprite = svgspriteContent.replace('<svg', '<svg aria-hidden="true" width="0" height="0"')

let spanSpriteWrapper = `
<span style="visibility: hidden; position: absolute; z-index: -1;">
${sprite}
</span>`

let string = `{@html \` ${spanSpriteWrapper} \` }`


fs.writeFileSync('src/lib/toolbox/sprite/Sprite.svelte', string)