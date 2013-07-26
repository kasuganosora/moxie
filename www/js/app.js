/**
 * @author sorakasugano
 * BeiDanChi
 */

window.globalScope = {};
window.onerror = function(e,url, lineNumber){
     console.log(JSON.stringify(e) + "  on:" + url + "  line:" +lineNumber);
};

document.addEventListener('touchmove',function(e){
    e.preventDefault();
});

document.addEventListener("deviceready",function(){
    window.globalScope.deviceready = true;

    getFileNamesInAPP("www/dict",function(files){
        window.globalScope.defaultDict = [];
        for(var i = 0,l = files.length; i < l; i++){
            var file = files[i];
            var fileName = file.replace(".json","");
            window.globalScope.defaultDict.push(fileName);
        }

    },null);

    GetFileNamesInDocument("dict",function(error,files){
        if(error){
            return;
        }
        window.globalScope.userDicts =  files;
    });
});

var app = angular.module('BeiDanChi', []).config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/dictlist',{templateUrl: 'tmp/dict-list.html',   controller: DictListCtrl}).//词典:首页
        when('/wordview/:dict/:dictType/:dictIndex',{templateUrl: 'tmp/word-view.html',   controller: WordView}).     //本次要背的单词预览页
        when('/wordcard/:dict/:dictType/:dictIndex',{templateUrl: 'tmp/word-card.html',   controller: WordCardCtrl}).     //背单词的界面
        when('/wordcardresult/:dict/:dictType/:dictIndex',{templateUrl: 'tmp/word-card-result.html',   controller: WordCardResultCtrl}).  //本次默写的结果
        when('/forgetwords/:dict/:dictType/:dictIndex',{templateUrl: 'tmp/forget-words.html',   controller: ForgetWordsCtrl}). //单词本
        when('/setting',{templateUrl: 'tmp/setting.html',   controller: SettingCtrl}).
        otherwise({redirectTo: '/dictlist'});

}]);


app.run(['$rootScope','$location',function($rootScope,$location){

    window.globalScope.$location = $location;

    $rootScope.$on('$viewContentLoaded', function(){
        var scroller = $(".wrapper");
        var isNoIScroll = scroller.hasClass("no-iscroll");

        if(scroller.length && !isNoIScroll){
            setTimeout(function(){
                window.globalScope.iScroll = new iScroll(scroller.get(0), {useTransition: true,vScroll:true,hScroll:false});
                window.globalScope.iScroll.refresh();
            },30);
        }

        var currentURL = $location.url();
        $("#footer-nav li.active").removeClass("active");
        $("#footer-nav a").each(function(index){
            var link = $(this);
            if(link.attr("href").indexOf(currentURL) > -1){
                link.parent().addClass('active');
            }
        });
    });

    // 设置默认参数
    var localStorage = window.localStorage;
    //每次背诵的单词个数
    if(!localStorage["wordCount"]){
        localStorage["wordCount"] = 20;
    }

    //每次复习的单词个数
    if(!localStorage["reviewCount"]){
        localStorage["reviewCount"] = 10;
    }

}]);
