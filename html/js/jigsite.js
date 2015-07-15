function edgeDetector(){
  
  // Variables

  this.imgElement = undefined;
  this.rawCanvas = undefined;
  this.rawctx = undefined;
  this.ctxDimensions = {
    width: undefined,
    height:undefined
  };
  this.pixelData = undefined;
  this.threshold = 30;
  
  this.init = function (elem, id, after) {

    this.imgElement = elem;

    var width = this.imgElement.width;
    var height = this.imgElement.height;

    // Build the canvas
    
    if (after == null) {
      after = elem;
    }

    this.rawCanvas = $("#" + id)[0];
    if (this.rawCanvas == null) {
      
      $("<canvas id=\"" + id + "\" width=\"" + width +
        "\" height=\"" + height +
        "\"></canvas>").insertAfter(after);
  
      this.rawCanvas = $("#" + id)[0];
    }
    
    this.rawctx = this.rawCanvas.getContext('2d');

    // Store the canvas size

    this.ctxDimensions.width = width;
    this.ctxDimensions.height = height;
  };
  
  this.resetSize = function (width, height) {

    if (width && !height) {
      height = width * (this.imgElement.height / this.imgElement.width);
    }
    else {
      if (!width) {
        width = this.imgElement.width;
      }
      if (!height) {
        height = this.imgElement.height;
      }
    }

    this.rawCanvas.width = width;
    this.rawCanvas.height = height;

    // Store the canvas size

    this.ctxDimensions.width = width;
    this.ctxDimensions.height = height;
  };

  this.findEdges = function () {
    //this.generatePixelData();
    this.coreLoop();
  };
  
  this.generatePixelData = function (canvas, width, height) {

    var created = false;
    if (canvas == null) {
      canvas = document.createElement('canvas');
      created = true;
    }

    var ctx = canvas.getContext('2d');
    if (!width) {
      width = this.imgElement.width;
    }
    if (!height) {
      height = this.imgElement.height;
    }
    canvas.width = width;
    canvas.height = height;

    if (created) {
      ctx.drawImage(this.imgElement, 0, 0, width, height);
    }

    var pixelData = ctx.getImageData(0, 0 , width, height);

    if (created) {
      canvas = null;
    }
    
    return pixelData;
  };
  
  this.coreLoop = function() {

    this.gatherPoints(this.pixelData, this.plotPoint);
  };
  
  this.generatePoints = function(pixelData, width, height) {
  	
    var points = [];

    this.gatherPoints(
      pixelData,
      function(obj,x,y) {
        points.push({ x: x, y: y });
      }
    );
    return ({
      width: $('#width').val(),
      height: $('#height').val(),
      pieces: $('#pieces').val(),
      xres: width,
      yres: height,
      pixels: points
    });
  }

  this.gatherPoints = function(pixelData, func) {
    var x = 0;
    var y = 0;
    var index = undefined;

    var pixel = undefined;
    var left = undefined;
    var top = undefined;
    var right = undefined;
    var bottom = undefined;

    var row = pixelData.width * 4;
    var third = 0.333333;

    for (y = 0; y < pixelData.height; y++) {
      for(x = 0; x < pixelData.width; x++) {

        // Get this pixel's data

        index = (x + y * pixelData.width) * 4;
        pixel =
          (pixelData.data[index + 2]
          + pixelData.data[index + 1]
          + pixelData.data[index]) * third;

        // Get the values of the surrounding pixels
        // Color data is stored [r,g,b,a][r,g,b,a]
        // in sequence.

        left =
          (pixelData.data[index - 2]
          + pixelData.data[index - 3]
          + pixelData.data[index - 4]) * third;

        right =
          (pixelData.data[index + 6]
          + pixelData.data[index + 5]
          + pixelData.data[index + 4]) * third;

        top =
          (pixelData.data[index - row]
          + pixelData.data[index + 1 - row]
          + pixelData.data[index + 2 - row]) * third;

        bottom =
          (pixelData.data[index + row]
           + pixelData.data[index + 1 + row]
           + pixelData.data[index + 2 + row]) * third;

        // Compare it all

        if (
          pixel > left + this.threshold ||
          pixel < left - this.threshold ||
          pixel > right + this.threshold ||
          pixel < right - this.threshold ||
          pixel > top + this.threshold ||
          pixel < top - this.threshold ||
          pixel > bottom + this.threshold ||
          pixel < bottom - this.threshold
        ) {
          func(this,x,y);
        }
      }
    }
  }
  
  this.plotPoint = function(obj,x,y){

    obj.rawctx.beginPath();
    obj.rawctx.arc(x, y, 0.5, 0, 2 * Math.PI, false);
    obj.rawctx.fillStyle = 'black';
    obj.rawctx.fill();
    obj.rawctx.beginPath();
  };

  this.process = function (elem, id) {
    if (elem == null) {
      elem = $('#image')[0];
    }
    if (id == null) {
      id = "rawData";
    }
    this.init(elem, id);
    this.pixelData = this.generatePixelData();
    this.findEdges();
  }

  this.update = function(val) {
    this.threshold = val;
    this.rawctx.clearRect(
      0, 0, this.ctxDimensions.width, this.ctxDimensions.height
    );
    this.coreLoop();
  }

  this.postData = function() {
    
    var width = 200,
        height = calcDim(200, false);
    var pixData = this.generatePixelData(null, width, height);
    var pts = this.generatePoints(pixData, width, height),
        ps = JSON.stringify(pts),
        url = 'data:text/json;charset=utf8,' + encodeURIComponent(ps);
    window.open(url, '_blank');
    window.focus();
  }  
}

var edgeDetector = new edgeDetector();

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcDim(val, getWidth) {
  var aspect =
    edgeDetector.imgElement.width /
    edgeDetector.imgElement.height;
  return getWidth ? val * aspect : val / aspect;
}

function setWidth(val) {
  $('#width').val(round2(val));
  $('#height').val(round2(calcDim(val, false)));
}

function setHeight(val) {
  $('#width').val(round2(calcDim(val, true)));
  $('#height').val(round2(val));
}

function setPieces(val) {
  $('#pieces').val(val);
}

$(document).ready(function(){
  
  // Run when the threshold changes

  //$('#threshold').change(function () {
  //  edgeDetector.update($(this).val());
  //});
  
  $('#width').change(function () { setWidth($(this).val()); } );
  $('#height').change(function () { setHeight($(this).val()); } );
});