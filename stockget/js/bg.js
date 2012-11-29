/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var webdb = null,
    db = null,
    fs = null;

function initDB () {
    db = openDatabase("Stock", "1.0", "Stock Get", 5*1024*1024, function(_db) {
        // if database was not created, create it.
        _db.changeVersion("", "1.0", function(t) {
            t.executeSql("CREATE TABLE IF NOT EXISTS every_min (time, price, change, trading_volume, trading_value)");
        });
    });
}

function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.match(/^https?:\/\/[a-z]+\.krx\.co\.kr\/.*$/g)) {
        chrome.pageAction.show(tabId);
    }
}

function fsErrorHandler(err) {
    console.error(err.toString());
}

function initFS() {
    window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 5, function(filesystem){
        fs = filesystem;
    }, fsErrorHandler);
}

function writeFile(name, data, callback) {
    if(!fs) { throw "File system not ready!!"; }

    fs.root.getFile(name, {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter){
            fileWriter.onwriteend = function(e) {
                // TODO
                getFileURL(name, callback);
            };
            fileWriter.onerror = fsErrorHandler;
            fileWriter.write(new Blob([data], {type: "text/plain;charet=UTF-8"}));
        }, fsErrorHandler);
    }, fsErrorHandler);
}

function getFileURL(name, callback) {
    if (!fs) { throw "File system not ready!!"; }

    fs.root.getFile(name, {create: false}, function(fileEntry) {
        callback(fileEntry.toURL());
    }, fsErrorHandler);
}

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
if (window.requestFileSystem) { initFS(); }
if (window.openDatabase) { initDB(); }

chrome.tabs.onUpdated.addListener(checkForValidUrl);

webdb = {
    "add": function(data, error, success) {
        // data: an array
        if (!db) { throw "db not prepared!!"; }
        db.transaction(function(t) {
            t.executeSql(
                "INSERT INTO every_min(time, price, change, trading_volume, trading_value) VALUES (?, ?, ?, ?, ?)",
                data);

        }, error, success);
    },
    "readAll": function(success) {
        if (!db) { throw "db not prepared!!"; }
        db.transaction(function(t) {
            t.executeSql("SELECT * FROM every_min ORDER BY time", [], success, function(t, err) {
                console.error(err.message);
            });
        });
    },
    "getCount": function(success) {
        if (!db) { throw "db not prepared!!"; }
        db.transaction(function(t) {
            t.executeSql("SELECT COUNT(*) AS c FROM every_min", [], success, function(t, err) {
                console.error(err.message);
            });
        });
    },
    "removeAll": function(success) {
        if (!db) { throw "db not prepared!!"; }
        db.transaction(function(t) {
            t.executeSql("DELETE FROM every_min");
        }, null, success);
    }
};

// message
chrome.extension.onMessage.addListener(function(msg, sender, resp) {

    var issavetodb = msg.issavetodb,
        type = msg.type;
    switch (type) {
    case "readall":
        if (issavetodb) {
            webdb.readAll(function(t, rs) {
                resp(rs.rows);
            });
            return true;
        }
        else {
            "stock_data" in window ? resp(window.stock_data) : resp(new Object);
            break;
        }
    case "getcount":
        if (issavetodb) {
            webdb.getCount(function(t, rs) {
                resp(rs.rows.item(0).c);
            });
        }
        else {
            !("stock_data" in window) ? resp(0) : function(){
                var stock_data = window.stock_data,
                    count = 0;
                for (var s in stock_data) {
                    count += stock_data[s].length;
                }
                resp(count);
            }();
        }
        return true;
    case "clear":
        if (issavetodb) {
            webdb.removeAll(function() {
                resp(true);
            });
        }
        else {
            window.stock_data = new Object;
            resp(true);
        }
        return true;
    case "closetab":
        chrome.tabs.remove(sender.tab.id);
        break;
    case "writefile":
        writeFile(msg.filename, msg.filecontent, function(url) {
            resp(url.toString());
        });
        return true;
    default:
        break;
    }
});

// long-live message
chrome.extension.onConnect.addListener(function(port) {
    if (port.name != "stockget") { return; }
    port.onMessage.addListener(function(msg) {
        if(msg.type === "add") {
            var data = msg.data || null;
            if (!data instanceof Array) {
                throw "data must be an \"Array\"";
            }
            // ask popup view is save data to db?
            var issavetodb = msg.issavetodb;
            // save to db
            if (issavetodb) {
                webdb.add(data, function(err) {
                    console.error(err);
                }, function() {
                    chrome.extension.sendMessage({type: "addcount"});
                });
            }
            // save to memory
            else {
                if (!msg.page) { throw "No page given!!"; }
                if (!("stock_data" in window)) { window.stock_data = new Object; }
                var page = msg.page.toString();
                if (!(page in window.stock_data)) {
                    window.stock_data[page] = new Array;
                }
                window.stock_data[page].push(msg.data);
                chrome.extension.sendMessage({type: "addcount"});
            }
        }
    });
});

var onBeforeRequestCallback = function() {
        return {cancel: true};
    },
    onBeforeRequestCallback2 = function(details) {
        var url = details.url;
        return {cancel: /(prototype|cjux|common_krx)\.js$/.test(url) ? false : true};
    },
    onBeforeRequestFilter = {
        urls: ["*://*.krx.co.kr/*"],
        types: ["sub_frame", "stylesheet", "image", "object"]
    },
    onBeforeRequestFilter2 = {
        urls: ["*://*.krx.co.kr/*"],
        types: ["script"]
    },
    onBeforeRequestOpt = ["blocking"];

chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestCallback, onBeforeRequestFilter, onBeforeRequestOpt);
chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequestCallback2, onBeforeRequestFilter2, onBeforeRequestOpt);
