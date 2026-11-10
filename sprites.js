/**
 * Pixel Sprites & Offscreen Pre-rendering for Dino Game
 * Provides authentic, crisp retro pixel art for Dino, Cacti, Pterodactyl, Clouds, Moon, and Stars.
 */

const PIXEL_SCALE = 2;

// --- Pixel Art Definitions (X = filled pixel, space = transparent) ---

const SPRITE_DATA = {
  dinoStand: [
    '               XXXXXXXX ',
    '              XXXXXXXXXX',
    '              XX XXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXX     ',
    '              XXXXXXXX  ',
    'X            XXXXXXXXX  ',
    'XX          XXXXXXXXXX  ',
    'XXX        XXXXXXXXXXX  ',
    'XXXX      XXXXXXXXXXXX  ',
    'XXXXX    XXXXXXXXXXXX   ',
    'XXXXXX  XXXXXXXXXXXX    ',
    ' XXXXXXXXXXXXXXXXXXX    ',
    '  XXXXXXXXXXXXXXXXX     ',
    '   XXXXXXXXXXXXXXX      ',
    '    XXXXXXXXXXXXX       ',
    '     XXXXXXXXXXX        ',
    '      XXXXXXXXX         ',
    '       XXXXXXX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '       XXX  XXX         '
  ],

  dinoRun1: [
    '               XXXXXXXX ',
    '              XXXXXXXXXX',
    '              XX XXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXX     ',
    '              XXXXXXXX  ',
    'X            XXXXXXXXX  ',
    'XX          XXXXXXXXXX  ',
    'XXX        XXXXXXXXXXX  ',
    'XXXX      XXXXXXXXXXXX  ',
    'XXXXX    XXXXXXXXXXXX   ',
    'XXXXXX  XXXXXXXXXXXX    ',
    ' XXXXXXXXXXXXXXXXXXX    ',
    '  XXXXXXXXXXXXXXXXX     ',
    '   XXXXXXXXXXXXXXX      ',
    '    XXXXXXXXXXXXX       ',
    '     XXXXXXXXXXX        ',
    '      XXXXXXXXX         ',
    '       XXXXXXX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '       XX               ',
    '       XXX              '
  ],

  dinoRun2: [
    '               XXXXXXXX ',
    '              XXXXXXXXXX',
    '              XX XXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXXXXXXX',
    '              XXXXX     ',
    '              XXXXXXXX  ',
    'X            XXXXXXXXX  ',
    'XX          XXXXXXXXXX  ',
    'XXX        XXXXXXXXXXX  ',
    'XXXX      XXXXXXXXXXXX  ',
    'XXXXX    XXXXXXXXXXXX   ',
    'XXXXXX  XXXXXXXXXXXX    ',
    ' XXXXXXXXXXXXXXXXXXX    ',
    '  XXXXXXXXXXXXXXXXX     ',
    '   XXXXXXXXXXXXXXX      ',
    '    XXXXXXXXXXXXX       ',
    '     XXXXXXXXXXX        ',
    '      XXXXXXXXX         ',
    '       XXXXXXX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '            XX          ',
    '            XXX         '
  ],

  dinoDuck1: [
    '                        XXXXXXXX ',
    '                       XXXXXXXXXX',
    '                       XX XXXXXXX',
    '                       XXXXXXXXXX',
    '                       XXXXXXXXXX',
    '                       XXXXX     ',
    'X                      XXXXXXXX  ',
    'XX                    XXXXXXXXX  ',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ',
    ' XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  ',
    '  XXXXXXXXXXXXXXXXXXXXXXXXXXXX   ',
    '   XXXXXXXXXXXXXXXXXXXXXXXXXX    ',
    '         XXXX   XXXX             ',
    '         XX                      ',
    '         XXX                     '
  ],

  dinoDuck2: [
    '                        XXXXXXXX ',
    '                       XXXXXXXXXX',
    '                       XX XXXXXXX',
    '                       XXXXXXXXXX',
    '                       XXXXXXXXXX',
    '                       XXXXX     ',
    'X                      XXXXXXXX  ',
    'XX                    XXXXXXXXX  ',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ',
    ' XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  ',
    '  XXXXXXXXXXXXXXXXXXXXXXXXXXXX   ',
    '   XXXXXXXXXXXXXXXXXXXXXXXXXX    ',
    '         XXXX   XXXX             ',
    '                XX               ',
    '                XXX              '
  ],

  dinoDead: [
    '               XXXXXXXX ',
    '              XXXXXXXXXX',
    '              XX X XXXXX',
    '              XXX XXX   ',
    '              XXXXXXXXXX',
    '              XXXXX     ',
    '              XXXXXXXX  ',
    'X            XXXXXXXXX  ',
    'XX          XXXXXXXXXX  ',
    'XXX        XXXXXXXXXXX  ',
    'XXXX      XXXXXXXXXXXX  ',
    'XXXXX    XXXXXXXXXXXX   ',
    'XXXXXX  XXXXXXXXXXXX    ',
    ' XXXXXXXXXXXXXXXXXXX    ',
    '  XXXXXXXXXXXXXXXXX     ',
    '   XXXXXXXXXXXXXXX      ',
    '    XXXXXXXXXXXXX       ',
    '     XXXXXXXXXXX        ',
    '      XXXXXXXXX         ',
    '       XXXXXXX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '       XX   XX          ',
    '       XXX  XXX         '
  ],

  cactusS1: [
    '    XX   ',
    '    XX   ',
    '  X XX   ',
    '  X XX X ',
    '  X XX X ',
    '  XXXX X ',
    '    XXXX ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   ',
    '    XX   '
  ],

  cactusS2: [
    '    XX        XX   ',
    '    XX        XX   ',
    '  X XX      X XX   ',
    '  X XX X    X XX X ',
    '  X XX X    X XX X ',
    '  XXXX X    XXXX X ',
    '    XXXX      XXXX ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   ',
    '    XX        XX   '
  ],

  cactusS3: [
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '  X XX      X XX      X XX   ',
    '  X XX X    X XX X    X XX X ',
    '  X XX X    X XX X    X XX X ',
    '  XXXX X    XXXX X    XXXX X ',
    '    XXXX      XXXX      XXXX ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   ',
    '    XX        XX        XX   '
  ],

  cactusL1: [
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '  X XXX    ',
    '  X XXX    ',
    '  X XXX  X ',
    '  X XXX  X ',
    '  X XXX  X ',
    '  XXXXX  X ',
    '    XXXXXX ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    ',
    '    XXX    '
  ],

  cactusL2: [
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '  X XXX        X XXX    ',
    '  X XXX        X XXX    ',
    '  X XXX  X     X XXX  X ',
    '  X XXX  X     X XXX  X ',
    '  X XXX  X     X XXX  X ',
    '  XXXXX  X     XXXXX  X ',
    '    XXXXXX       XXXXXX ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    ',
    '    XXX          XXX    '
  ],

  bird1: [
    '              XX    ',
    '             XXXX   ',
    '            XXXXXX  ',
    '           XXXXXXXX ',
    '          XXXXXXXXXX',
    '       XX XXXXXXXXXX',
    '      XXXX XXXXXXXX ',
    '     XXXXXXXXXXXXX  ',
    '    XXXXXXXXXXXXX   ',
    'XXXXXXXXXXXXXXXXX   ',
    ' XXXXXXXXXXXXXXX    ',
    '   XXXXXXXXXXXX     ',
    '     XXXXXXXX       ',
    '       XXXX         '
  ],

  bird2: [
    '       XX           ',
    '      XXXX          ',
    '     XXXXXXXXXXXXX  ',
    '    XXXXXXXXXXXXX   ',
    'XXXXXXXXXXXXXXXXX   ',
    ' XXXXXXXXXXXXXXX    ',
    '   XXXXXXXXXXXX     ',
    '     XXXXXXXX       ',
    '      XXXX XXXXXXXX ',
    '       XX XXXXXXXXXX',
    '          XXXXXXXXXX',
    '           XXXXXXXX ',
    '            XXXXXX  ',
    '             XXXX   ',
    '              XX    '
  ],

  cloud: [
    '       XXXXXXX         ',
    '     XXXXXXXXXXX       ',
    '    XXXXXXXXXXXXX      ',
    '   XXXXXXXXXXXXXXX   XX',
    '  XXXXXXXXXXXXXXXXXXXXX',
    ' XXXXXXXXXXXXXXXXXXXXX ',
    '  XXXXXXXXXXXXXXXXXXX  '
  ],

  moon: [
    '    XXXXXX   ',
    '  XXXXXXXXXX ',
    ' XXXXXXXXXXXX',
    'XXXXXX       ',
    'XXXXX        ',
    'XXXXX        ',
    'XXXXX        ',
    'XXXXXX       ',
    ' XXXXXXXXXXXX',
    '  XXXXXXXXXX ',
    '    XXXXXX   '
  ],

  star: [
    ' X ',
    'XXX',
    ' X '
  ],

  restartIcon: [
    '      XXXXXX      ',
    '    XXXXXXXXXX    ',
    '   XXX      XXX   ',
    '  XX    XX   XXX  ',
    ' XX    XXXX   XX  ',
    ' XX    XXXX   XX  ',
    ' XX           XX  ',
    ' XX    X     XXX  ',
    '  XX    XXXXXX    ',
    '   XXX            ',
    '    XXXXXXXXXX    ',
    '      XXXXXX      '
  ]
};

/**
 * Creates an HTMLCanvasElement from an array of ASCII pixel rows.
 */
function createPixelSprite(matrix, color, scale = PIXEL_SCALE) {
  const height = matrix.length;
  let width = 0;
  for (let r = 0; r < height; r++) {
    if (matrix[r].length > width) width = matrix[r].length;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;

  for (let y = 0; y < height; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'X') {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  return canvas;
}

/**
 * Pre-renders all game sprites for Day and Night themes.
 */
class SpriteCache {
  constructor() {
    this.dayColors = {
      primary: '#535353',
      cloud: '#c4c4c4',
      moon: '#dedede',
      star: '#ffffff'
    };

    this.nightColors = {
      primary: '#f7f7f7',
      cloud: '#666666',
      moon: '#ffeb3b',
      star: '#ffffff'
    };

    this.day = {};
    this.night = {};

    this.init();
  }

  init() {
    for (const [key, matrix] of Object.entries(SPRITE_DATA)) {
      // Pick specialized colors for clouds and celestial objects
      let dayColor = this.dayColors.primary;
      let nightColor = this.nightColors.primary;

      if (key === 'cloud') {
        dayColor = this.dayColors.cloud;
        nightColor = this.nightColors.cloud;
      } else if (key === 'moon') {
        dayColor = '#888888';
        nightColor = this.nightColors.moon;
      } else if (key === 'star') {
        dayColor = '#aaaaaa';
        nightColor = this.nightColors.star;
      }

      this.day[key] = createPixelSprite(matrix, dayColor, PIXEL_SCALE);
      this.night[key] = createPixelSprite(matrix, nightColor, PIXEL_SCALE);
    }
  }

  get(key, isNight = false) {
    return isNight ? this.night[key] : this.day[key];
  }
}

window.SpriteCache = SpriteCache;

