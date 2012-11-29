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
function Retrieve() {
    // var table = document.getElementById("tbl1");
    // if (!table || table.rows.length === 0) {
    //     throw "No data in this page";
    // }
    var port = chrome.extension.connect({name: "stockget"}),
        page = location.search.toString().replace("?", "").split("=")[1];

    chrome.storage.local.get(["issavetodb"], function(items) {
        var issavetodb = items.issavetodb,
            intervalId = setInterval(function(doc, p){
                if (doc.querySelector("div.displayProcessStatusImage") !== null) { return; }
                var table = doc.getElementById("tbl1");
                console.log(table);
                for (var i = 1, len = table.rows.length; i < len ; i++) {
                    var row = table.rows[i],
                        cells = row.cells,
                        time = cells[0].innerHTML,
                        price = cells[1].innerHTML,
                        change = cells[2].textContent.replace(/\"/, "").trim(),
                        trading_volume = cells[3].innerHTML,
                        trading_value = cells[4].innerHTML;
                    p.postMessage({
                        "type": "add",
                        "page": doc.querySelector("div.page>table.page_navi td.active").textContent.trim(),
                        "issavetodb": issavetodb,
                        "data": [time, price, change, trading_volume, trading_value]
                    });
                }
                clearInterval(intervalId);
                if(!("_noclose" in window))
                    chrome.extension.sendMessage({type: "closetab"});
            }, 1500, document, port);
    });
}

Retrieve();
