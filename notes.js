/**
 * Bind a textfield to a label
 */
var textfield = new qx.ui.form.TextField("Change me...");
textfield.setLiveUpdate(true);
this.getRoot().add(textfield, {left: 10, top: 10});
var label = new qx.ui.basic.Label("Change me...");
this.getRoot().add(label, {left: 120, top: 12});
// bind the textfield to the label
textfield.bind("changeValue", label, "value");

/**
 * Bind two slider together
 */
var slider1 = new qx.ui.form.Slider("horizontal");
slider1.setWidth(300);
this.getRoot().add(slider1, {left: 10, top: 50});
var slider2 = new qx.ui.form.Slider("horizontal");
slider2.setWidth(200);
this.getRoot().add(slider2, {left: 10, top: 80});
// set up the bidirectional single value binding
slider1.bind("value", slider2, "value");
slider2.bind("value", slider1, "value");

      var widgets = [];
       

      // spinner
      widgets.push(new qx.ui.form.Spinner());
      this.getRoot().add(widgets[0], {left: 20, top: 180});

      // slider
      widgets.push(new qx.ui.form.Slider());
      widgets[1].setWidth(200);
      this.getRoot().add(widgets[1], {left: 20, top: 220});

var numlab = new qx.ui.basic.Label("0");
this.getRoot().add(numlab, {left:20, top:260});
var numlab2 = new qx.ui.basic.Label("0");
this.getRoot().add(numlab2, {left:80, top:260});

//widgets[0].bind("value", widgets[1],"value");
//widgets[1].bind("changeValue", numlab,"value");
//widgets[1].bind("changeValue", numlab2,"value");
// add the listener
widgets[1].addListener("changeValue", function(e) {
  // convert the number to a string
  numlab.setValue(e.getData() + " used");
  numlab2.setValue((100-e.getData()) + " remain ");
}, this);
