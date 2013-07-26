/**
 * @author sorakasugano
 */
function DictListCtrl($scope, $routeParams){
    function setUserDictsList(){
        if(window.globalScope.deviceready){
            $scope.userDicts = window.globalScope.userDicts;
            $scope.defaultDict = window.globalScope.defaultDict;
            $scope.$apply();
        }else{
            setTimeout(setUserDictsList,10);
        }
    }

    setTimeout(setUserDictsList,10);
    var  bottomPad =  $("#bottom-pad");
    var nowSelectItem = null;
    var list =  $(".dict-list .list");

    $(".dict-list .list,.footer-nav-warp,header").on("touchstart",function(){
          if(! bottomPad.is(':hidden')){
              bottomPad.show().animate({bottom:0 - bottomPad.height() -10},100,'linear',function(){
                  $(this).hide();
              });
          }
    });

    list.on("click",".dict-item",function(e){
        return false;
    });


    list.longpress(function(e){
        var target =  $(e.target);

        if(!target.is('a')){
            return;
        }
        nowSelectItem = target;
        bottomPad.show().animate({bottom:0},500);
    });

    $("#goto-moxie").on("click touchstart",function(e){
        var url =  nowSelectItem.attr("href").substr(1);
        window.globalScope.$location.url(url);
        $scope.$apply();
    });

    $("#goto-forgetwords").on("click touchstart",function(e){
        var url =  nowSelectItem.attr("href").substr(1);
        var urlPart = url.split("/");
        urlPart[1] = 'forgetwords';
        url = urlPart.join('/');

        window.globalScope.$location.url(url);
        $scope.$apply();
    });
}

function WordView($scope,$routeParams){
    //获取本次会出现的单词列表
    var dictName =  $routeParams.dict;
    var dictType =  $routeParams.dictType;
    var dictIndex = parseInt($routeParams.dictIndex);
    $scope.dictType =   dictType;
    $scope.dictIndex = dictIndex;
    $scope.dictName = dictName;

    async.auto({

        readDict:function(callback){
            if(dictType === "defaultDict"){
                $.getJSON("dict/" + dictName + ".json").done(function(data){
                    callback(null, data);
                });
            }else{
                var dictFileInfo = window.globalScope.userDicts[dictIndex];
                readSJONFile(dictFileInfo.entry,function(data){
                    callback(null, data);
                });
            }
        },

        makeCurrentWordList:["readDict",function(callback,results){
            var wordCount = parseInt(localStorage["wordCount"]);
            var lastEndIndex =   parseInt(localStorage[dictName + "-lastEndIndex"]);
            var dict =  results.readDict;

            if(isNaN(lastEndIndex)){
                lastEndIndex = 0;
            }

            var currentStareIndex = lastEndIndex;
            var currentLastEndIndex = currentStareIndex + wordCount - 1;

            if(currentLastEndIndex > (dict.content.length -1) ){
                currentLastEndIndex = dict.content.length -1
            }
            var wordIndexs = [];
            var wordList = [];


            var i, l;

            //生成顺序索引
            for( i = 0, l = wordCount; i < l; i++){
                wordIndexs[i] =  currentStareIndex + i;
            }

            for( i = 0,l = wordIndexs.length; i < l; i++){
                var ix = wordIndexs[i];

                var word = dict.content[ix];
                word.index = ix;
                wordList.push(word);
            }

            // 设定当前要考到的单词列表到页面变量中
            $scope.wordList = wordList;
            $scope.$apply();
            //设置当前词典和单词列表
            window.globalScope.currentWordCardsInfo = {
                dict: dict,
                wordIndexs:wordIndexs
            };

        }]
    });
}

function WordCardCtrl($scope, $routeParams){
    if(!window.globalScope.currentWordCardsInfo){
        window.globalScope.$location.url("/");
        return;
    }

    var dictName =  $routeParams.dict;
    var dictType =  $routeParams.dictType;
    var dictIndex = parseInt($routeParams.dictIndex);
    var dictDB;
    var dict =  window.globalScope.currentWordCardsInfo.dict;

    window.globalScope.currentWordCardsInfo.wrongList = [];

    var localStorage = window.localStorage;
    var currentStareIndex;
    var currentLastEndIndex;

    //获取已经忘记的词
    //获取新的词
    async.auto({
        openDB:function(callback){
            dictDB = openDatabase(dictName, '1.0', dictName + ' DB', 2 * 1024 * 1024);
            dictDB.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS need_review_word (id unique,word,wrong_count)');
                callback(null,null);
            },null);
        },

        getNeedReviewWordIndexs:["openDB",function(callback,results){
            var reviewCount =  localStorage["reviewCount"];
            var reviewWordIndexs = [];
            dictDB.transaction(function (tx) {
                tx.executeSql('SELECT id FROM need_review_word where wrong_count > 0 LIMIT ?', [reviewCount], function(tx,dbret){
                  for(var i = 0,l = dbret.rows.length; i < l; i++){
                      var row = dbret.rows.item(i);
                      reviewWordIndexs.push(row.id);
                  }
                  callback(null,reviewWordIndexs);
                }, function(err){
                    callback(null,reviewWordIndexs);
                    console.log("Exec SQL err in getNeedReviewWordIndexs");
                },null);
            });
        }],

        makeCurrentWordList:["getNeedReviewWordIndexs",function(callback,results){

            var needReviewIndexs = results.getNeedReviewWordIndexs;
            var wordCount = parseInt(localStorage["wordCount"]);
            var lastEndIndex =   parseInt(localStorage[dictName + "-lastEndIndex"]);

             if(isNaN(lastEndIndex)){
                 lastEndIndex = 0;
             }

            currentStareIndex = lastEndIndex;
            currentLastEndIndex = currentStareIndex + wordCount - 1;

            if(currentLastEndIndex > (dict.content.length -1) ){
                currentLastEndIndex = dict.content.length -1
            }
            var wordIndexs = window.globalScope.currentWordCardsInfo.wordIndexs;
            var wordList = [];
            var i, l,rA,rB,tmp;

            wordIndexs = wordIndexs.concat(needReviewIndexs);
            wordIndexs = $.unique(wordIndexs);
            //打乱索引

            for(i = 0, l = wordIndexs.length; i < l; i++){
               rA = Math.floor(Math.random() * l);
               rB = Math.floor( Math.random() * l);
                if(rA == rB){
                   if(rA == currentLastEndIndex || rA > 0){
                       rA--;
                   }else{
                       rA++;
                   }
                }
                //交换索引
                tmp = wordIndexs[rA];
                wordIndexs[rA] = wordIndexs[rB];
                wordIndexs[rB] = tmp;
            }

            //解决最后一个始终相同的问题
            rA = Math.floor(Math.random() * (wordIndexs.length -1));
            rB = wordIndexs.length - 1;

            tmp = wordIndexs[rA];
            wordIndexs[rA] = wordIndexs[rB];
            wordIndexs[rB] = tmp;

             for( i = 0,l = wordIndexs.length; i < l; i++){

                 var ix = wordIndexs[i];
                 var word = dict.content[ix];
                 word.index = ix;
                 wordList.push(word);
             }

            callback(null,wordList);
        }],

        initWordCard:["makeCurrentWordList",function(callback, results){
            var wordList =  results.makeCurrentWordList;
            var answer = "";
            var wrongList = [];//错误的单词列表
            var word = null; //当前的单词;

            function setNextWordCard(){
                if(!wordList.length){
                    return false;
                }

                word = wordList.pop();  //设置当前单词
                if(dict.testMethod  && dict.testMethod == "description"){
                    $scope.description = word.word;
                    answer = word.description;
                }else{
                    $scope.description = word.description;
                    answer = word.word;
                }

                $scope.$apply();
                return true;
            }

            function setWrong(word,index,isDec){

                dictDB.transaction(function(tx){
                    var worgCount = 0;

                    tx.executeSql("SELECT wrong_count FROM need_review_word WHERE id = ?",[index],function(tx,dbret){
                       if(dbret.rows.length > 0){
                           var row = dbret.rows.item(0);
                          worgCount = row.wrong_count;

                       }else{
                           worgCount = 0;
                       }

                        if(isDec){
                            worgCount = worgCount > 0 ?  worgCount-1 : 0; //答对一次就减一次复习次数
                        }else{
                            worgCount += 3;//每次打错一次就增加 4次复习次数
                        }

                        tx.executeSql('REPLACE INTO need_review_word (id, word,wrong_count) VALUES ('+index+', "'+word+'",'+worgCount+')' );

                    },null);

                } ,null);
            }


            $scope.dictName =   dict.name;
            $scope.$apply();


            setNextWordCard();

            $("#btn-submit").on("click touchstart",function(){
                var inputAnswer = $("#answer");
                var userAnswer = inputAnswer.val().trim();

                if(userAnswer != answer){
                    //答错了
                    window.globalScope.currentWordCardsInfo.wrongList.push(word);
                    setWrong(word.word,word.index,false);
                }else{
                    //答对了
                    setWrong(word.word,word.index,true);
                }
                inputAnswer.val("");
                inputAnswer.focus();

                 //下一个单词
                if(!setNextWordCard()){
                   //答完本次所有单词后转到答错的单词结果列表页
                    window.globalScope.$location.url("/wordcardresult/"+dictName + '/' + dictType + '/' + dictIndex);
                    $scope.$apply();

                    //保存下一次开始的单词索引
                    if(currentLastEndIndex + 1 >= dict.content.length){
                        localStorage[dictName + "-lastEndIndex"] = 0;
                    }else{
                        localStorage[dictName + "-lastEndIndex"] = currentLastEndIndex + 1;
                    }
                }
                return false;
            });

        }]
    });

}

function WordCardResultCtrl($scope, $routeParams){
    var  currentWordCardsInfo = window.globalScope.currentWordCardsInfo;
    $scope.wrongCount = currentWordCardsInfo.wrongList.length;
    $scope.wordCount =  localStorage["wordCount"];
    $scope.wrongWords = currentWordCardsInfo.wrongList;
    $scope.dictName =  $routeParams.dict;
    $scope.dictType =  $routeParams.dictType;
    $scope.dictIndex = parseInt($routeParams.dictIndex);

}


function ForgetWordsCtrl($scope, $routeParams){
    var dictName =  $routeParams.dict;

    var dictType =  $routeParams.dictType;
    var dictIndex = parseInt($routeParams.dictIndex);

    var dictPath = "dict/" + dictName + ".json";
    var dictDB;
    async.auto({
        openDB:function(callback){
            dictDB = openDatabase(dictName, '1.0', dictName + ' DB', 2 * 1024 * 1024);
            dictDB.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS need_review_word (id unique,word,wrong_count)');
                callback(null,null);
            },null);
        },

        readDict:function(callback){
            if(dictType === "defaultDict"){
                $.getJSON("dict/" + dictName + ".json").done(function(data){
                    $scope.dictFullName = data.name;
                    $scope.$apply();
                    callback(null, data);
                });
            }else{
                var dictFileInfo = window.globalScope.userDicts[dictIndex];
                console.log(JSON.stringify($routeParams));
                readSJONFile(dictFileInfo.entry,function(data){
                    $scope.$apply();
                    callback(null, data);
                });
            }
        },

        getNeedReviewWordIndexs:["openDB",function(callback,results){
            var reviewCount =  localStorage["reviewCount"];
            var reviewWordIndexs = [];
            dictDB.transaction(function (tx) {
                tx.executeSql('SELECT id FROM need_review_word', [], function(tx,dbret){
                    for(var i = 0,l = dbret.rows.length; i < l; i++){
                        var row = dbret.rows.item(i);
                        reviewWordIndexs.push(row.id);
                    }
                    callback(null,reviewWordIndexs);
                }, function(err){
                    callback(null,reviewWordIndexs);
                    console.log("Exec SQL err in getNeedReviewWordIndexs");
                },null);
            });
        }],

       initForgetWordList:["readDict","getNeedReviewWordIndexs",function(callback,results){
           var wIndexs =  results.getNeedReviewWordIndexs;
           var dict = results.readDict;

           var wordList = [];

           for(var i = 0, l = wIndexs.length; i < l; i++){
               var ix =  wIndexs[i];
               wordList.push(dict.content[ix]);
           }

           $scope.wordList = wordList;
           $scope.$apply();

           callback(null,null);
       }]
    });
}

function SettingCtrl($scope, $routeParams){
    var localStorage = window.localStorage;
    var wordCount = localStorage["wordCount"] ?  localStorage["wordCount"] : 20;
    var reviewCount =  localStorage["reviewCount"] ? localStorage["reviewCount"] : 10;

    var inputWordCount = $("#word-count");
    var inputRewviewCount = $("#review-count");
    inputWordCount.val(wordCount);
    inputRewviewCount.val(reviewCount);

    $("#btn-save").on("click touchstart",function(){
        wordCount = parseInt(inputWordCount.val().trim());
        reviewCount = parseInt(inputRewviewCount.val().trim());

        if(wordCount < 3){
            inputWordCount.val(3);
            navigator.notification.alert("单词数必须大于或等于3", function(){}, "错误", "确定");
            return;
        }

        if(reviewCount < 3){
            inputRewviewCount.val(3);
            navigator.notification.alert("单词数必须大于或等于3", function(){}, "错误", "确定");
            return;
        }

        wordCount = isNaN(wordCount) || wordCount < 3 ? 20 : wordCount;
        reviewCount = isNaN(reviewCount) || reviewCount < 3 ? 20 : reviewCount;

        localStorage["wordCount"] =  wordCount;
        localStorage["reviewCount"] =  reviewCount;
        navigator.notification.alert("已经保存设置", function(){}, "设置", "确定");
        return false;
    });
}