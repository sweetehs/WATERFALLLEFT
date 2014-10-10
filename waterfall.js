"use strict";
;(function($){
    window.WATERFALLLEFT = function(options) {
        $.extend(this, {
            $wrapper: $("html"),                        // 需要添加瀑布流的父级
            baseHeight: 300,                            // 横向瀑布流的高度
            margin: 5,                                  // 每个li之间的距离
            line: 2,                                    // 瀑布流的行数
            itemClassName: "",                          // 每个li上的class
            isStaticLoad: false,                        // 是否为静态加载图片 暂时只有ajax加载功能
            animateTime : 250,                          // 运动时间
            windowWidth : this.$wrapper.outerWidth(),   // 瀑布流的置顶宽度
            tmpHandle: function() {},                   // 模板处理，需要返回字符串
            lazyImgLoadCallback: function() {},         // ajax 加载数据的函数，在ajax加载完成后需要调用loadImg函数
            animateRightCallback : function(){},        // 向右运动完成后的callback
            animateLeftCallback : function(){},         // 向左运动完成后的callback
            endLoad : function(){},                     // 最后加载完成后的callback函数
            startLoad : function(){},                   // 最初加载完成后的callback函数
            isEnd : null
        }, options);
        this.baseHeight = parseInt(this.baseHeight);
        this._init();
        return this;
    };

    WATERFALLLEFT.prototype = {
        _init: function() {
            this.length = 0;
            this.newBaseHeight = this.baseHeight;
            this._lazyScreenNum =  2,
            this._arrWidth = [];
            this._minIndex = 0;
            this.loadImgUrl = "http://img1.cache.netease.com/ent/zwn/loading.gif";
            this.point = "";
            this.loadFlag = true;
            this._domReady();
            this._cssReady();
            this._loadingShow();
            this.lazyImgLoadCallback(this.length);
        },
        _cssReady: function() {
            this.$wrapper.find(".water-wrapper").css({
                left: this._getXScale(this._getCurrentMarginLeft())
            }).end().find(".water-item").css({
                height: this.newBaseHeight
            }).end().find("ul").css({
                height: this.newBaseHeight,
                position: "relative"
            });
        },
        _domReady: function() {
            var html = "";
            for (var i = 0; i < this.line; i++) {
                html += '<div class="water-item" style="margin-top:' + this.margin + 'px"><ul></ul></div>';
                this._arrWidth.push({
                    currentWidth: 0,
                    num: 0,
                    list: []
                });
            }
            html = '<div class="water-wrapper" style="position:absolute;left:0;">' + html + "</div>";
            this.$wrapper.html(html);
        },
        _imgBaseHandle: function(data, baseHeight) {
            data.baseHeight = parseInt(baseHeight || this.baseHeight);
            data.baseWidth = parseInt(data.baseHeight * data.width / data.height);
        },
        _getXScale: function(left) {
            var newLeft = parseInt(left * this.newBaseHeight / this.baseHeight);
            return newLeft;
        },
        _isLoadingShow: function() {
            var $loadingImg = this.$wrapper.find(".wrapper-loading");
            return $loadingImg.is(":not(:hidden)");
        },
        _loadingShow: function() {
            var $loadingImg = this.$wrapper.find(".wrapper-loading");
            if ($loadingImg.length === 0) {
                var $img = $('<div class="wrapper-loading"><img style="position:absolute;left:50%;top:50%;margin-left:-21px;margin-top:-21px;" src=' + this.loadImgUrl + "></div>").css({
                    position: "absolute",
                    // 对于业务有20像素的校正
                    left : "20px",
                    top : "20px",
                    width : "100%",
                    height : "100%",
                    height : this.baseHeight * this.line + 30,
                    background : "#fff",
                    "margin-left" : "-21px",
                    "margin-top" : "-42px",
                    "z-index" : 100,
                    opacity : .8
                });
                this.$wrapper.append($img);
            }else{
                $loadingImg.css({
                    width: "100%",
                    height: this.baseHeight * this.line + 30
                })
            }
            $loadingImg.fadeIn();
        },
        _loadingHide: function() {
            this.$wrapper.find(".wrapper-loading").hide();
        },
        _doGroup: function(o) {
            var $min = "";
            var current = this._arrWidth[0];
            var left = 0;
            var index = 0;
            for (var i = 1; i < this._arrWidth.length; i++) {
                var data = this._arrWidth[i];
                if (current.currentWidth > data.currentWidth) {
                    index = i;
                    current = data;
                }
            }
            this._minIndex = index;
            left = current.currentWidth;
            current.currentWidth += o.baseWidth;
            o.left = left;
            o.index = current.num;
            current.num++;
            current.list.push(o);
        },
        _combineLiItem: function(data) {
            var html, $dom;
            if (!data.$dom) {
                html = this.tmpHandle ? this.tmpHandle(data) : "\u8bf7\u5904\u7406\u6a21\u677f";
                $dom = $("<li data-index=" + data.index + " class='" + this.itemClassName + "' style='height:100%;position:absolute;'>" + html + "</li>");
                data.$dom = $dom;
            }
            data.$dom.css({
                left: data.left + data.index * this.margin
            }).find("img").replaceWith(data.$img.css({
                height: data.baseHeight,
                width: data.baseWidth,
                opacity: 1,
                "-webkit-backface-visibility": "visible"
            }));
            return $dom;
        },
        sortByDateTime : function(arr){
            arr.sort(function(a,b){
                var x = new Date(a.datetime.replace(/-/g,   "/"));
                var y = new Date(b.datetime.replace(/-/g,   "/"));
                return y - x;
            })
            return arr;
        },
        loadImg: function(objList, callback) {
            var that = this;
            var num = 0;
            var tempArr = [];
            this.length += objList.length;
            for (var i = 0; i < objList.length; i++) {
                var data = objList[i];
                var $img = $("<img>");
                !(function(_data) {
                    $img.load(function() {
                        num++;
                        _data.height = this.height;
                        _data.width = this.width;
                        _data.$img = $(this);
                        // 根据现有比例，对已加载的image的高度和宽度进行等比例缩放。
                        that._imgBaseHandle(_data);
                        // 进行排序
                        tempArr.push(_data);
                        // 根据时间进行排序
                        // TODO 可以写的更通用
                        that.sortByDateTime(tempArr);
                        // ajax本次加载图片完成
                        if (num === objList.length) {
                            // 进行分组
                            for(var j=0;j<tempArr.length;j++){
                                that._doGroup(tempArr[j]);
                            }
                            that._loadingHide();
                            // next自动判断是否继续加载；如果一次加载的数量足够多，则不需要进行判断
                            // if (that.isLoadMore() && !that.isStaticLoad) {
                            //     that.lazyImgLoadCallback && that.lazyImgLoadCallback(that.length);
                            // } else {

                            // 是第一次加载则需要添加首屏显示的dom
                            if(that.$wrapper.find("li").length === 0){
                                that._commonHandleData("init");
                            }else{
                                if(that.point === "next"){
                                    that.next();
                                }
                            }

                            //}
                        }
                    });
                    $img.error(function() {
                        num++;
                        if (num === objList.length) {
                            that._loadingHide();
                            if(that.$wrapper.find("li").length === 0){
                                that._commonHandleData("init");
                            }else{
                                if(that.point === "next"){
                                    that.next();
                                }
                            }
                        }
                    });
                    $img.attr("src", data.cover);
                })(data);
            }
        },
        _handleResize: function() {
            for (var i = 0, l = this._arrWidth.length; i < l; i++) {
                this._arrWidth[i].currentWidth = this._getXScale(this._arrWidth[i].currentWidth);
                for (var j = 0, _l = this._arrWidth[i].list.length; j < _l; j++) {
                    var data = this._arrWidth[i].list[j];
                    data.left = this._getXScale(data.left);
                    this._imgBaseHandle(data, this.newBaseHeight);
                    this._combineLiItem(data);
                }
            }
        },
        resize: function(w, h) {
            this.windowWidth =  w || this.windowWidth;
            this.baseHeight = this.newBaseHeight;
            this.newBaseHeight = h || this.newBaseHeight;
            this._cssReady();
            this._handleResize();
            this._commonHandleData("resize");
        },
        _getCurrentMarginLeft: function() {
            return parseInt(this.$wrapper.find(".water-wrapper").css("left").split("px")[0]);
        },
        _getLazyLoadScreenNum: function() {
            var marginLeft = this._getCurrentMarginLeft();
            return (marginLeft - this.windowWidth + this._arrWidth[this._minIndex].currentWidth) / this.windowWidth;
        },
        isLoadCurrent: function() {
            return this._getLazyLoadScreenNum() > 1;
        },
        isLoadMore: function() {
            return this._getLazyLoadScreenNum() < this.lazyScreenNum;
        },
        _isAdoptItem: function(type,data,left) {
            var leftEdge, rightEdge;
            left = left || this._getCurrentMarginLeft();
            left = left < 0 ? -left : left;
            leftEdge = parseInt(left - this.windowWidth * 3);
            rightEdge = parseInt(left + this.windowWidth * 3);
            if (leftEdge < data.left && data.left < rightEdge) {
                data.showFlag = true;
                return true;
            } else {
                data.showFlag = false;
                return false;
            }
        },
         _eachArrWidth : function(callback){
            var $waterItem = this.$wrapper.find(".water-item");
            for(var i=0,l=this._arrWidth.length;i<l;i++){
                var $item = $waterItem.eq(i);
                var $li = $item.find("li");
                callback && callback(this._arrWidth[i],$item,$li);
            }
        },
        _commonHandleData : function(type){
            var that = this;
            // 得到当时MarginLeft；
            var currentLeft = this._getCurrentMarginLeft();
            this._eachArrWidth(function(data,$item,$li){
                // 三种种方式进行遍历数组，为了减少比例的次数
                // 1:next 遍历
                // 2:prev 遍历
                // 3:resize || init 遍历
                var $ul = $("<ul></ul>");
                var _flag = false;
                var j;
                if(type === "prev"){
                    j = parseInt($li.last().attr("data-index"));
                    for (j; j >= 0; j--) {
                        var _data = data.list[j];
                        var flag = that._isAdoptItem(type,_data);
                        if (flag) {
                            _flag = flag;
                            that._combineLiItem(_data);
                            $ul.prepend(_data.$dom);
                        } else if (!flag && _flag) {
                            break;
                        }
                    }
                    $item.find("ul").empty().prepend($ul.children());
                }else if(type === "next"){
                    j = parseInt($li.first().attr("data-index"));
                    for (j, _l = data.list.length; j < _l; j++) {
                        var _data = data.list[j];
                        var flag = that._isAdoptItem(type,_data);
                        if (flag) {
                            _flag = flag;
                            that._combineLiItem(_data);
                            $ul.append(_data.$dom);
                        } else if (!flag && _flag) {
                            break;
                        }
                    }
                    $item.find("ul").empty().append($ul.children());
                }else if(type === "resize" || type === "init"){
                    for (var j = 0, _l = data.list.length; j < _l; j++) {
                        var _data = data.list[j];
                        // 横向 挑选屏幕中合适的data
                        var flag = that._isAdoptItem(type,_data);
                        // 找到第一个不合适的，跳出循环
                        if (flag) {
                            _flag = flag;
                            that._combineLiItem(_data);
                            $ul.append(_data.$dom);
                        } else if (!flag && _flag) {
                            break;
                        }
                    }
                    $item.find("ul").empty().append($ul.children());
                }
            })
            this.baseHeight = this.newBaseHeight;
        },
        _nextMiddle : function(callback){
            this.point = "next";
            // 维护arrWidth列表
            if(this.isLoadMore()){
                // 判断是否是最后一次加载
                if(this.isEnd !== null && !this.isEnd()){
                    this._loadingShow();
                    // 加载更多元素
                    this.lazyImgLoadCallback(this.length);
                }else{
                    this._loadingHide();
                    this.endLoad();
                }
            }else{
                // 处理元素
                this._commonHandleData("next");
                callback && callback();
            }
        },
        _prevMiddle : function(callback){
            this.point = "prev";
            this._loadingHide();
            this._commonHandleData("prev");
            callback && callback();
        },
        next: function() {
            if(!this._isLoadingShow()){
                var that = this;
                var marginLeft = this._getCurrentMarginLeft();
                marginLeft = "-=" + this.windowWidth;
                this._nextMiddle(function(){
                    that._animate(marginLeft,function(){
                        that.animateRightCallback();
                    });
                });
            }
        },
        prev: function() {
            if(!this._isLoadingShow()){
                var that = this;
                var marginLeft = this._getCurrentMarginLeft();
                if (marginLeft + this.windowWidth > 0) {
                    marginLeft = 0;
                    this.startLoad();
                } else {
                    marginLeft = "+=" + this.windowWidth;
                }
                this._prevMiddle(function(){
                    that._animate(marginLeft,function(){
                        that.animateLeftCallback();
                    });
                });
            }
        },
        _animate: function(left, callback) {
            var that = this;
            if(that.$wrapper.find(".water-wrapper").is(":not(:animated)")){
                that.$wrapper.find(".water-wrapper").animate({
                    left: left
                }, that.animateTime, function() {
                    callback && callback();
                });
            }
        }
    };
})(jQuery);