/*jshint browser:true*/
/*
* Copyright (c) Codiad & Andr3as, distributed
* as-is and without warranty under the MIT License.
* See http://opensource.org/licenses/MIT for more information.
* This information must remain intact.
*/

(function(global, $){

    var codiad  = global.codiad,
        scripts = document.getElementsByTagName('script'),
        path    = scripts[scripts.length-1].src.split('?')[0],
        curpath = path.split('/').slice(0, -1).join('/')+'/';

    $(function() {
        codiad.MiniMap.init();
    });

    codiad.MiniMap = {

        path        : curpath,
        worker      : true,
        changeNumber: null,
        scrollNumber: null,
        template    : "",

        init: function() {
            var _this = this;
            $.get(this.path+"template.html", function(data){
                _this.template = data;
                $('#editor-top-bar').before(data);
            });
            //Get worker
            this.worker = new Worker(this.path+'worker.js');
            this.worker.addEventListener('message', this.getWorkerResult.bind(this));
            //Render canvas
            amplify.subscribe("active.onFocus", function(path){
                _this.updateMap();
            });
            //document on change listener
            amplify.subscribe("active.onOpen", function(path){
                var session = codiad.editor.getActive().getSession();
                session.on('changeScrollTop', function(scrollTop){
                    //Changed scrolling
                    if (_this.scrollNumber === null) {
                        _this.scrollNumber = setTimeout(function(){
                            _this.scrollNumber = null;
                            _this.colorLines();
                        }, 50);
                    }
                    _this.colorLines();
                });
                session.on('change', function(e){
                    if (_this.changeNumber === null) {
                        _this.changeNumber = setTimeout(function(){
                            _this.changeNumber = null;
                        }, 2000);
                        //Update canvas
                        _this.updateMap();
                    }
                });
            });
            //Reset Canvas
            amplify.subscribe("active.onClose", function(path){
                _this.resetMap();
            });
            amplify.subscribe("active.onRemoveAll", function(){
                _this.resetMap();
            });
            //Click listener
            $('.minimap pre').live('click', function(e){
                var y = e.pageY;
                var offset  = $('.minimap pre').offset().top;
                var height  = $('.minimap pre').height();
                var length  = codiad.editor.getActive().getSession().getLength();
                var line    =  Math.floor((y-offset) / (height / length));
                codiad.editor.gotoLine(line);
                _this.updateMap();
            });
        },

        updateMap: function() {
            var mode    = $('#current-mode').text();
            var code    = codiad.editor.getContent();
            this.worker.postMessage({code: code, mode: mode});
        },

        getWorkerResult: function(e) {
            $('.minimap .code').text(e.data.code);
            this.colorLines();
        },

        colorLines: function() {
            var first   = codiad.editor.getActive().renderer.getFirstFullyVisibleRow() + 1;
            var last    = codiad.editor.getActive().renderer.getLastFullyVisibleRow() + 1;
            var lines   = last - first;
            var height  = $('.minimap pre').height();
            var length  = codiad.editor.getActive().getSession().getLength();
            var size    = height / length * lines;
            var offset  = height / length * first;
            $('.minimap .background').css('height', size + "px");
            $('.minimap .background').css('margin-top', offset + "px");
        },

        resetMap: function(){
            $('.minimap').replaceWith(this.template);
            $('.minimap .background').css('height', 0);
        },

        getExtension: function(path) {
            return path.substring(path.lastIndexOf(".")+1);
        }
    };
})(this, jQuery);