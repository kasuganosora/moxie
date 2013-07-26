function getFileNamesInAPP(subdir,callback,err){
    cordova.exec(callback,err,"Reitsuki","getFileNamesInAPP",[subdir]);
}

function getRootEntry(callback){
    if(window.rootFS){
        callback(null,window.rootFS);
        return;
    }
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        window.rootFS = fileSystem.root;
        callback(null,rootFS);
    }, function(error){
        console.log("get FileSystem error at GetFileNamesInDocument:getFS");
        console.log(error);
        callback(error,null);
    });
}


function GetFileNamesInDocument(dirName,callback){
    if(!dirName){
        dirName = "";
    }
    async.auto({
        getFS:getRootEntry,
        getDirectoryEntry:["getFS",function(callback,results){
            var rootFS = results.getFS;
            if(dirName.length == 0){
                callback(null,rootFS);
                return;
            }
            rootFS.getDirectory(dirName, {create: true, exclusive: false}, function(entry){
                callback(null,entry);
            }, function(error){
                console.log("get DirectoryEntry error at GetFileNamesInDocument:getDirectoryEntry");
                console.log(error);
                callback(error,null);
            });
        }],
        getFileNamesInDirectory:["getDirectoryEntry",function(callback,resluts){

            var directoryReader = resluts.getDirectoryEntry.createReader();

            directoryReader.readEntries(function(entries){
                var fileNameList = [];
                var i;
                for (i=0; i<entries.length; i++) {
                    var entry = entries[i];
                    if(entry.isDirectory || entry.name.indexOf(".") === 0){
                        continue;
                    }
                    fileNameList.push({
                        fullName:entry.name,
                        name:entry.name.replace(/\..+?$/,""),
                        entry:entry,
                        fullPath:entry.fullPath
                    });
                }
                callback(null,fileNameList);
            },function(error){
                console.log("get DirectoryEntry error at GetFileNamesInDocument:getFIleNamesInDirectory");
                console.log(error);
                callback(error,null);
            });
        }]

    },function(error, results){
        if(error == null){
            callback(null,results.getFileNamesInDirectory);
        }else{
            callback(error,null);
        }
    });
}


function readFile(entry,callback){
    function win(file) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            callback(evt.target.result)
        };
        reader.readAsText(file);
    };

    var fail = function(evt) {
        console.log(error.code);
    };

    entry.file(win, fail);
}

function readSJONFile(entry,callback){
    readFile(entry,function(content){
        try{
            var obj = JSON.parse(content);
            callback(obj);
        }catch(e){
            console.log("readSJONFile Error:"+e);
        }
    })
}