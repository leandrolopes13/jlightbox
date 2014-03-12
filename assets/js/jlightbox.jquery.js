(function($){

  var $this;
  var settings;

  var group = [];

  var container,overlay;
  var containerHeight, containerWidth, windowHeight = $(window).height(), windowWidth = $(window).width();

  var index, nextIndex, prevIndex;

  var methods = {
    init: function(options){

      $this = this;
      settings = $.extend({}, $.fn.jlightbox.defaults, options);

      settings.onInit.call();
      imageLoading = new Image();
      imageLoading.src = settings.img_loading;
      $this.click(function(event){event.preventDefault();})
      $this.each(function(event,index){
        getType($(this));
      });

      $this.on('onContentLoaded',function(){
        console.log('cotent load');
      });

      set();
      verifyContainer();
      settings.onLoad.call();

      $(window).unbind('resize').bind('resize',function(){ 
        fitContent(content);
        center_overlay();
      });

      if(settings.keyboard_shortcuts){
        $(document).unbind('keydown').keydown(function(e){
          if(e.which == 37){
            e.preventDefault();
            $('.jlightbox-controls .jlightbox-control-prev').trigger('click');
          }else if(e.which == 39){
            e.preventDefault();
            $('.jlightbox-controls .jlightbox-control-next').trigger('click');
          }else if(e.which == 27){
            e.preventDefault();
            close();
          }
        });
      }

    },
    close: function(){

      close();

    },
    center: function(){

      center_overlay();

    }
  };

  function getType(obj){
    var type = "";
    var rel = (obj.attr('rel') && obj.attr('rel')!= "")?obj.attr('rel'):'lightbox';
    var href = obj.attr('href');
    var itemJson = {};

    if (isImage(href)) {
      itemJson = {
        type: 'image',
        href: href,
        rel: rel
      };
    } else if (isSWF(href)) {
      itemJson = {
        type: 'swf',
        href: href,
        rel: rel
      };
    } else if(isYoutube(href)){
      video_id = isYoutube(href);
      width = (parseFloat(getParam('width',href)))?getParam('width',href):settings.width.toString();
      height = (parseFloat(getParam('height',href)))?getParam('height',href):settings.height.toString();
      href = settings.youtube_embed_url.replace(/{video_id}/g,video_id);
      itemJson = {
        type: 'youtube',
        width: width,
        height: width,
        href: href,
        rel: rel
      };
    } else if(isVimeo(href)){
      type = 'vimeo';
      video_id = isVimeo(href);
      width = (parseFloat(getParam('width',href)))?getParam('width',href):settings.width.toString();
      height = (parseFloat(getParam('height',href)))?getParam('height',href):settings.height.toString();
      href = settings.vimeo_embed_url.replace(/{video_id}/g,video_id);
      itemJson = {
        type: 'vimeo',
        width: width,
        height: width,
        href: href,
        rel: rel
      };
    } else if (href.charAt(0) === '#') {
      type = 'inline';
      itemJson = {
        type: 'inline',
        href: href,
        rel: rel
      };
    } 

    if(group[rel]){
      group[rel].push(itemJson);  
    }else{
      group[rel] = new Array();
      group[rel].push(itemJson);  
    }

  }

  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  function set(){
    if(Object.size(group) > 0){
      for (var key in group) {
        $('[rel='+key+']').click(function(event){
          event.preventDefault();
          open($('[rel='+$(this).attr('rel')+']').index(this),$(this).attr('rel'));
        });
      }
    }
  }

  function verifyContainer(){
    if(container == undefined || container.length == 0){
      $('body').prepend('<div class="jlightbox-overlay"></div>');
      overlay = $('div.jlightbox-overlay');
      if(settings.modal == false){
        overlay.addClass('transparent')
      }
      $('body').prepend(settings.container_markup);
      container = $('div.jlightbox-container');
    }else{
      container = $('div.jlightbox-container');
    }
  }

  function close(){
    if(settings.modal){
      overlay.hide();
    }
    $('body').removeClass('fix');
    container.hide();
  }

  function actControls(act, relgroup){
    if(settings.btn_close){
      if(act == 'show'){
        $('.jlightbox-control-close').show();
      }else{
        $('.jlightbox-control-close').hide();
      }
    }
    if(settings.pagination){
      if(act == 'show' && Object.size(relgroup) > 0){
        $('.jlightbox-controls').show();
      }else{
        $('.jlightbox-controls').hide();
      }
    }
  }

  function doLoading(obj,status){

    contentLoading = settings.image_loading_markup.replace(/{path}/g,settings.img_loading);
    content = obj;

    if(status == 'start'){
      obj.hide();
      obj.after(contentLoading);
      fitContent(content);
      center_overlay();
    }else{
      $('.loading-image').remove();
      obj.show();
      fitContent(content);
      center_overlay();
    }

  }

  function open(index,rel){
    var nodeinfo = group[rel][index];
    if(index < 0 && Object.size(group[rel]) > 0 && settings.end_cycle){
      return open((Object.size(group[rel])-1),rel);
    }else if(index > Object.size(group[rel])-1 && Object.size(group[rel]) > 0 && settings.end_cycle){
      open(0,rel);
    }else if(nodeinfo === false || typeof nodeinfo === "undefined"){
      return false;
    }
    settings.onOpen.call();
    $('body').addClass('fix');
    if(settings.modal){
      overlay.show();
    }

    container.show();
    
    if(nodeinfo){
      if(nodeinfo.type == 'youtube' || nodeinfo.type == 'vimeo'){

        content = settings.iframe_markup.replace(/{width}/g,settings.width).replace(/{height}/g,settings.height).replace(/{wmode}/g,settings.wmode).replace(/{path}/g,nodeinfo.href);
        container[0].innerHTML = settings.markup.replace(/{content}/g,content);

        doLoading($('iframe#iframe-lightbox'),'start');
        $('iframe#iframe-lightbox').load(function() {
          doLoading($('iframe#iframe-lightbox'),'end');
          actControls('show',group[rel]);
          settings.onContentLoaded.call();
        });

        changePage(nodeinfo.type,index,rel);

      }else if(nodeinfo.type == 'image'){

        imgPreloader = new Image();

        content = settings.image_markup.replace(/{path}/g,nodeinfo.href);  
        container[0].innerHTML = settings.markup.replace(/{content}/g,content);

        doLoading($('.jlightbox-content img'),'start');

        changePage(nodeinfo.type,index,rel);

        imgPreloader.onload = function(){
          doLoading($('.jlightbox-content img'),'end');
          actControls('show',group[rel]);
          settings.onContentLoaded.call();
        };

        imgPreloader.onerror = function(){
          alert('Image cannot be loaded. Make sure the path is correct and image exist.');
          close();
        };

        imgPreloader.src = nodeinfo.href;

      }else if(nodeinfo.type == 'inline'){
        content = settings.inline_markup.replace(/{content}/g,$(nodeinfo.href).html());  
        container[0].innerHTML = settings.markup.replace(/{content}/g,content);
        doLoading($('.jlightbox-inline'),'start');
        $(window).trigger('resize');
        doLoading($('.jlightbox-inline'),'end');
        actControls('show',group[rel]);

        changePage(nodeinfo.type,index,rel);
        settings.onContentLoaded.call();
      }

      $('a.jlightbox-btn-close').unbind('click').click(function(event){
        event.preventDefault();
        close();
      });

      overlay.unbind('click').click(function(event){
        event.preventDefault();
        close();
      });
      
    }

    settings.onOpenComplete.call();

  }

  function changePage(type,index,rel){
    if(index < 0){
      $('.jlightbox-controls .jlightbox-control-prev').addClass('disabled');
      $('.jlightbox-controls .jlightbox-control-prev').unbind('click');
    }else{
      if(type == 'image'){
        prevImage = new Image();
      }
      prevIndex = index-1;
      prevGroupImage = group[rel][prevIndex];
      $('.jlightbox-controls .jlightbox-control-prev').unbind('click').click(function(event){
        event.preventDefault();
        if(type == 'image'){
          if(prevGroupImage){
            prevIndex.src = prevGroupImage.href;
          }
        }
        open(prevIndex,rel);
        settings.onPageChanged.call();
      });
    }
    if(index >= $('[rel='+rel+']').length-1 && settings.end_cycle == false){
     $('.jlightbox-controls .jlightbox-control-next').addClass('disabled'); 
     $('.jlightbox-controls .jlightbox-control-next').unbind('click');
   }else{
    if(type == 'image'){
      nextImage = new Image();
    }
    nextIndex = index+1;
    nextGroupImage = group[rel][nextIndex];
    $('.jlightbox-controls .jlightbox-control-next').unbind('click').click(function(event){
      event.preventDefault();
      if(type == 'image'){
        if(nextGroupImage){
          nextImage.src = nextGroupImage.href;
        }
      }
      open(nextIndex,rel);
      settings.onPageChanged.call();
    });
  }
}

function fitContent(obj) {
  windowHeight = $(window).outerHeight(); 
  windowWidth = $(window).outerWidth();
  content = obj;
  width = content.outerWidth();
  height = content.outerHeight();
  container = $('div.jlightbox-container');
  containerWidth = container.outerWidth();
  containerHeight = container.outerHeight();

  imageWidth = width, imageHeight = height;

  if(((containerWidth > windowWidth) || (containerHeight > windowHeight))) {
    fitting = false;

    while (!fitting){
      if((containerWidth > windowWidth)){
        imageWidth = (windowWidth - 200);
        imageHeight = (height/width) * imageWidth;
      }else if((containerHeight > windowHeight)){
        imageHeight = (windowHeight - 200);
        imageWidth = (width/height) * imageHeight;
      }else{
        fitting = true;
      }

      containerHeight = imageHeight, containerWidth = imageWidth;
    }
    content.width(100);
    content.height(100);
    center_overlay();
    container.animate({left: (windowWidth-imageWidth)/2, top: (windowHeight-imageHeight)/2}, 500, function(){});
    content.animate({height: imageHeight,width: imageWidth}, {duration: 500,easing: "jswing"}, function(){
     center_overlay();
   });
  }

}

function center_overlay(){
  container = $('div.jlightbox-container');
  containerWidth = container.width();
  containerHeight = container.height();

  if(settings.modal){
    overlay.width($(document).width());
    overlay.height($(document).height());
  }

  container.css({
    'left': (windowWidth-containerWidth)/2+'px',
    'top': (windowHeight-containerHeight)/2+'px'
  });
}

function isString(str){
  return str && $.type(str) === "string";
}

function isQuicktime(str){
  isString(str) && str.match(/\b.mov\b/i);
}

function isImage(str){
  return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
}

function isSWF(str){
  return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
}

function isYoutube(str) {
  var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  return (str.match(p)) ? RegExp.$1 : false;
}

function isVimeo(str) {
  var p = /http:\/\/(?:www\.|player\.)?(vimeo)\.com\/(?:embed\/|video\/)?(.*?)(?:\z|$|\?)/;
  return (str.match(p)) ? RegExp.$2 : false;
}

function getParam(name,url){
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( url );
  return ( results == null ) ? "" : results[1];
}

$.fn.jlightbox = function(methodOrOptions) {
  if (methods[methodOrOptions]){
    return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
  }else if(typeof methodOrOptions === 'object' || !methodOrOptions){
    return methods.init.apply(this, arguments);
  }else{
    $.error('Method ' +  methodOrOptions + ' does not exist on jQuery.jlightbox.');
  }    
};

$.fn.jlightbox.defaults = {
  container_markup: '<div class="jlightbox-container">{content}</div>',
  markup: '<div class="jlightbox-inner"> \
  <div class="jlightbox-control-close"> \
  <a href="#" class="jlightbox-btn-close glyphicon glyphicon-remove"></a><div class="clearfix"></div> \
  </div> \
  <div class="jlightbox-content">{content}</div> \
  <div class="jlightbox-controls"> \
  <a class="jlightbox-control-prev glyphicon glyphicon-chevron-left" href="#"></a> \
  <a class="jlightbox-control-next glyphicon glyphicon-chevron-right" href="#"></a> \
  <div class="clearfix"></div> \
  </div> \
  </div>',
  image_markup: '<img src={path} />',
  image_loading_markup: '<img class="loading-image" src="{path}" />',
  iframe_markup: '<iframe id="iframe-lightbox" src ="{path}" width="{width}" height="{height}" frameborder="no"></iframe>',
  flash_markup: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="{width}" height="{height}"><param name="wmode" value="{wmode}" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{path}" /><embed src="{path}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="{width}" height="{height}" wmode="{wmode}"></embed></object>',
  quicktime_markup: '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="{height}" width="{width}"><param name="src" value="{path}"><param name="autoplay" value="{autoplay}"><param name="type" value="video/quicktime"><embed src="{path}" height="{height}" width="{width}" autoplay="{autoplay}" type="video/quicktime" pluginspage="http://www.apple.com/quicktime/download/"></embed></object>',
  inline_markup: '<div class="jlightbox-inline">{content}</div>',
  wmode: 'transparent',
  youtube_embed_url: 'http://www.youtube.com/embed/{video_id}',
  vimeo_embed_url: 'http://player.vimeo.com/video/{video_id}?title=0&byline=0&portrait=0',
  width: 500,
  height: 344,
  img_loading: 'assets/img/loading.gif',
  btn_close: true,
  pagination: true,
  height_controls: 60,
  keyboard_shortcuts: true,
  end_cycle: true,
  modal: true,
  onInit: function(){},
  onLoad: function(){},
  onOpen: function(){},
  onOpenComplete: function(){},
  onContentLoaded: function(){},
  onPageChanged: function(){}
};

})(jQuery);