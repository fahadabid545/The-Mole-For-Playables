import Phaser from 'phaser';

const FAM = '"Luckiest Guy", Impact, "Arial Black", sans-serif';

type S = Phaser.Types.GameObjects.Text.TextStyle;

export const TS = {
  hero: (): S => ({
    fontFamily: FAM, fontSize: '150px', color: '#ffb300',
    stroke: '#4a1a05', strokeThickness: 16,
    shadow: { offsetX: 0, offsetY: 12, color: '#000000', blur: 18, fill: true }, align: 'center',
  }),
  title: (color = '#1b5e20'): S => ({
    fontFamily: FAM, fontSize: '54px', color, stroke: '#fff8e1', strokeThickness: 5,
    shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 4, fill: true },
  }),
  h2: (color = '#3e2723'): S => ({
    fontFamily: FAM, fontSize: '38px', color, stroke: '#fff8e1', strokeThickness: 3,
  }),
  body: (color = '#3e2723'): S => ({
    fontFamily: 'Arial, sans-serif', fontSize: '26px', color, fontStyle: 'bold',
  }),
  hudBig: (color = '#fffde7'): S => ({
    fontFamily: FAM, fontSize: '42px', color, stroke: '#1b5e20', strokeThickness: 6,
  }),
  hudSmall: (color = '#fffde7'): S => ({
    fontFamily: FAM, fontSize: '26px', color, stroke: '#3e2723', strokeThickness: 4,
  }),
  score: (color = '#fff176'): S => ({
    fontFamily: FAM, fontSize: '48px', color, stroke: '#3e2723', strokeThickness: 6,
  }),
  buttonLabel: (): S => ({
    fontFamily: '"Arial Black", Impact, sans-serif',
    fontSize: '30px', color: '#fff8e1',
    stroke: '#3e2723', strokeThickness: 4, align: 'center',
    shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 3, fill: true },
  }),
  countdown: (): S => ({
    fontFamily: FAM, fontSize: '220px', color: '#fffde7',
    stroke: '#1b5e20', strokeThickness: 14,
  }),
  banner: (): S => ({
    fontFamily: FAM, fontSize: '96px', color: '#fff8e1',
    stroke: '#1b5e20', strokeThickness: 10,
  }),
  reward: (): S => ({
    fontFamily: FAM, fontSize: '34px', color: '#ffca28', stroke: '#3e2723', strokeThickness: 5,
  }),
  chipDark: (): S => ({
    fontFamily: FAM, fontSize: '30px', color: '#fffde7', stroke: '#1b5e20', strokeThickness: 4,
  }),
};
