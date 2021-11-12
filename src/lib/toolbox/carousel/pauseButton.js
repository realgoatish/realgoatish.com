export function PauseButton (domNode, carouselObj) {
  this.domNode = domNode;

  this.carousel = carouselObj;
};

PauseButton.prototype.init = function () {
  this.domNode.addEventListener('click', this.handleClick.bind(this));
};

/* EVENT HANDLERS */

PauseButton.prototype.handleClick = function () {
  this.carousel.toggleRotation();
};