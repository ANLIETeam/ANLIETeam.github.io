var spriteObject = {
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 64,
    sourceHeight: 64,
    x: 0,
    y: 0,
    width: 64,
    height: 64,
    //Стороны спрайта
    left: function() {
        return this.x;
    },
    right: function() {
        return this.x + this.width;
    },
    top: function() {
        return this.y;
    },
    bottom: function() {
        return this.y + this.height;
    },
    //Геттеры
    centerX: function()
    {
      return this.x + (this.width / 2);
    },
    centerY: function()
    {
      return this.y + (this.height / 2);
    },
    halfWidth: function()
    {
      return this.width / 2;
    },
    halfHeight: function()
    {
      return this.height / 2;
    }
};

var spacecraft = Object.create(spriteObject);
spacecraft.NORMAL = 1;
spacecraft.EXPLODED = 2;
spacecraft.state = spacecraft.NORMAL;
spacecraft.explode = function(){
 var frameIndex = 0;
 var spacecraft = this

 var explosionInterval = setInterval(function () {
     if (frameIndex++ == 12){
      clearInterval(explosionInterval)
    } else {
      spacecraft.sourceX = 229 + (frameIndex % 6) * 126;
      spacecraft.sourceWidth = 126
      spacecraft.sourceY = (frameIndex < 6 ? 0 : 126);
      spacecraft.sourceHeight = 126
    }
  }, 100)
};
