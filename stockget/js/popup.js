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
(function() {
    var information_dom = document.getElementById("information"),
        save_buttton = document.getElementById("save"),
        retrieve_count = document.getElementById("retrieve_count"),
        clear_button = document.getElementById("clear"),
        refresh_button = document.getElementById("refresh"),
        save_to_db_checkbox = document.getElementById("save_to_db"),
        get_range_button = document.getElementById("all"),
        get_this_button = document.getElementById("single");

    var current_page_div = document.createElement("div"),
        total_page_div = document.createElement("div");

    function afterAnalysis() {
        
        try {
            chrome.storage.local.get("current_page", function(item){
                var current_page = item["current_page"] || 1;
                current_page_div.textContent = "Current at page " + current_page;
            });
            chrome.storage.local.get("last_page", function(item){
                var last_page = item["last_page"] || 1;
                total_page_div.textContent = "Total page: " + last_page;
                window.last_page = last_page;
            });
        }
        catch (err) {
            console.error(err);
        }

        information_dom.appendChild(current_page_div);
        information_dom.appendChild(total_page_div);
    }

    function doGetThis() {
        chrome.tabs.executeScript(null, {code: "window._noclose = true"}, function(){
            chrome.tabs.executeScript(null, {file: "js/retrieve.js"});
        });
        get_this_button.disabled = true;
    }

    function doGetAll() {
        var start = 1, end = parseInt(window.last_page);

        chrome.tabs.query({
            windowType: "normal",
            active: true,
            currentWindow: true
        }, function(tabs) {

            var tab = tabs[0],
                url = tab.url.toString().split("?")[0],
                run = function(s, e) {
                    var _e = s + e;
                    for (; s < _e ; s++) {
                        chrome.tabs.create({
                            url: url + "?cur_page=" + s,
                            active: false
                        }, function(tab){
                            chrome.tabs.executeScript(tab.id, {file: 'js/retrieve.js'});
                        });
                    }
                };
                // step = 10,
                // interval = 2000,
                // floor = Math.floor((end - start + 1)/ step),
                // remainder = (end - start + 1) % step;
            
            run(start, end - start + 1);
            // if (remainder > 0) { floor += 1; }    

            // for (var i = 0 ; i < floor ; i++) {
            //     var _start = (i * step) + start;

            //     setTimeout(function(r, s, e, v){
            //         r(s, e, v);
            //     }, interval * i,
            //     run,
            //     _start,
            //     (i === (floor - 1)) ? remainder : step,
            //     interval);
            // }
        });
        get_range_button.disabled = true;
    }

    function doSave() {

        chrome.extension.sendMessage({type: "readall"}, function(data) {
            var keys = Object.keys(data),
                i = 0, ilen = keys.length,
                dataset = new Array,
                datastr = new String;

            for (; i < ilen ; i ++) {
                var d = data[(i + 1).toString()];
                dataset = dataset.concat(d);
            }

            for (var j = dataset.length - 1 ; j > -1 ; j--) {
                datastr += dataset[j].join(" ") + "\n";
            }

            chrome.extension.sendMessage({
                type: "writefile",
                filename: "stock" + Math.floor((Math.random()*1000) + 1).toString() +".csv",
                filecontent: datastr
            }, function(url) {
                var a = document.createElement("a"),
                    evt = document.createEvent("MouseEvents");
                a.href = url.toString();
                a.type = "text/csv";
                a.target = "_blank";
                evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(evt);
            });
        });
    }

    function doClear() {
        chrome.extension.sendMessage({type: "clear", issavetodb: save_to_db_checkbox.checked}, function(resp) {
            if(resp) { retrieve_count.textContent = 0; }
        });
    }

    function doGetCount() {
        chrome.extension.sendMessage({type: "getcount", issavetodb: save_to_db_checkbox.checked}, function(resp) {
            var img = retrieve_count.querySelector("img");
            if (img) { retrieve_count.removeChild(img); }
            retrieve_count.textContent = resp;
        });
    }

    function doView() {
        chrome.tabs.executeScript(null, {file: "js/view.js"});
    }

    // Initialize
    function init() {
        chrome.storage.local.remove(["current_page", "last_page"]);
        chrome.storage.local.get("issavetodb", function(item) {
            "issavetodb" in item ? 
                function() {
                    save_to_db_checkbox.checked = get_range_button.disabled = item.issavetodb;
                }() : chrome.storage.local.set({issavetodb: save_to_db_checkbox.checked});
        });
        chrome.tabs.executeScript(null, {file: "js/analysis.js"}, afterAnalysis);
        chrome.extension.onMessage.addListener(function(msg, sender, resp) {
            if (msg.type == "addcount") {
                retrieve_count.textContent = (parseInt(retrieve_count.textContent) + 1).toString();
            }
        });

        save_to_db_checkbox.onclick = function() {
            chrome.storage.local.set({"issavetodb": save_to_db_checkbox.checked});
            get_range_button.disabled = save_to_db_checkbox.checked;
            doGetCount();
        }
        get_range_button.onclick = doGetAll;
        get_this_button.onclick = doGetThis;
        save_buttton.onclick = doSave;
        clear_button.onclick = doClear;
        refresh_button.onclick = doGetCount;
        doGetCount();
    }

    init();

}).call(this);
