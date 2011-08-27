
(function($) {
    
    var p = null,
        timer = null,
        fadeTime = 300,
        displayTime = 1000;
    
    $.flash = function(text, addclass) {
        if (!p) {
            p = $("<p>").addClass("flash").appendTo("body")
                    .append(span = $("<span>"));
        }
        
        if (p.data("addclass")) {
            p.removeClass(p.data("addclass"));
            $.removeData(p, "addclass");
        }
        p.stop(true, true).hide().removeAttr("style");
        clearTimeout(timer);
        
        if (addclass) {
            p.addClass(addclass).data("addclass", addclass);
        }
        span.text(text);
        p.show("fade", fadeTime);
        timer = setTimeout(function() {
            p.hide("fade", fadeTime);
        }, displayTime);
    };
    
})(jQuery);

