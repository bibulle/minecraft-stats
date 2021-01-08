
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.pug', { title: 'Minecraft : Stats' });
};
